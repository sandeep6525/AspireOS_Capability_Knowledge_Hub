import ipaddress
from datetime import datetime, timezone
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import Source, ContentItem


BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0"}


class IngestionError(Exception):
    def __init__(self, message: str, stage: str, status_code: int = 500):
        self.message = message
        self.stage = stage
        self.status_code = status_code
        super().__init__(self.message)


def safe_public_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme != "https": return False
    if not parsed.hostname: return False
    if parsed.hostname in BLOCKED_HOSTS or parsed.hostname.endswith(".local"): return False
    
    # Simple explicit IP blocking for private/loopback/link-local
    try:
        ip = ipaddress.ip_address(parsed.hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return False
    except ValueError:
        pass # Not an IP, just a hostname
        
    return True


def ingest_source(db: Session, source: Source) -> int:
    if not source.feed_url:
        raise IngestionError("Source has no feed URL configured", "validation", 400)
    if not safe_public_url(source.feed_url):
        raise IngestionError("Feed URL failed security validation (SSRF protection)", "validation", 403)
        
    def check_url(request: httpx.Request):
        if not safe_public_url(str(request.url)):
            raise IngestionError(f"Unsafe redirect URL blocked: {request.url}", "redirect_validation", 403)
            
    with httpx.Client(event_hooks={'request': [check_url]}) as client:
        try:
            response = client.get(source.feed_url, timeout=15, follow_redirects=True, headers={"User-Agent": "AspireOS-CapabilityHub/1.0"})
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise IngestionError(f"The source server rejected the request with HTTP {e.response.status_code}", "fetch", e.response.status_code)
        except httpx.RequestError as e:
            raise IngestionError(f"Network error while connecting to source: {str(e)}", "fetch", 502)
            
    content_type = response.headers.get("Content-Type", "").lower()
    allowed_types = ["application/rss+xml", "application/xml", "text/xml", "application/atom+xml"]
    if not any(t in content_type for t in allowed_types):
        raise IngestionError(f"Invalid Content-Type returned by source: {content_type}", "mime_validation", 415)
        
    if source.id == 1 and b"<WbgNews" in response.content:
        return parse_wbg_news(db, source, response.content)
        
    feed = feedparser.parse(response.content)
    if feed.bozo and not feed.entries:
        raise IngestionError("Failed to parse feed or feed is empty", "parse", 422)

    count = 0
    for entry in feed.entries[:50]:
        link = entry.get("link", "")
        if not safe_public_url(link) or db.scalar(select(ContentItem.id).where(ContentItem.canonical_url == link)):
            continue
        tags = [t.get("term", "").lower() for t in entry.get("tags", []) if t.get("term")]
        published = None
        if entry.get("published_parsed"):
            published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        db.add(ContentItem(source_id=source.id, canonical_url=link, title=entry.get("title", "Untitled")[:500],
                           abstract=entry.get("summary", "")[:4000], topics=tags, stakeholder_roles=[],
                           resource_type="update", licence="link-only", status="pending_review", published_at=published))
        count += 1
    db.commit()
    return count

def parse_wbg_news(db: Session, source: Source, response_content: bytes) -> int:
    try:
        root = ET.fromstring(response_content)
    except ET.ParseError:
        raise IngestionError("World Bank XML could not be parsed", "parse", 422)
    
    if root.tag != "WbgNews":
        raise IngestionError("Expected WbgNews root element not found", "parse", 422)
        
    count = 0
    for news in root.findall("news")[:50]:
        link_elem = news.find("url")
        link = link_elem.text if link_elem is not None else ""
        if link.startswith("http://"):
            link = "https://" + link[7:]
            
        if not link or not safe_public_url(link) or db.scalar(select(ContentItem.id).where(ContentItem.canonical_url == link)):
            continue
            
        title_elem = news.find("title")
        title = title_elem.text if title_elem is not None else "Untitled"
        title = title[:500]
        
        descr_elem = news.find("descr")
        if descr_elem is None or not descr_elem.text: 
            descr_elem = news.find("content")
        abstract = descr_elem.text if descr_elem is not None and descr_elem.text else ""
        abstract = abstract[:4000]
        
        tags = []
        for topic in news.findall("topic"):
            if topic.text:
                tags.append(topic.text.lower())
                
        published = None
        lnchdt = news.find("lnchdt")
        if lnchdt is not None and lnchdt.text:
            try:
                published = datetime.fromisoformat(lnchdt.text.replace("Z", "+00:00"))
            except ValueError:
                pass
                
        conttype = news.find("conttype")
        resource_type = conttype.text.lower() if conttype is not None and conttype.text else "update"
        if len(resource_type) > 40: resource_type = resource_type[:40]
        
        db.add(ContentItem(source_id=source.id, canonical_url=link, title=title,
                           abstract=abstract, topics=tags, stakeholder_roles=[],
                           resource_type=resource_type, licence="link-only", status="pending_review", published_at=published))
        count += 1
        
    db.commit()
    return count

