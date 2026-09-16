import ipaddress
from datetime import datetime, timezone
from urllib.parse import urlparse
import feedparser
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import Source, ContentItem


BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0"}


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
    if not source.feed_url or not safe_public_url(source.feed_url):
        return 0
        
    def check_url(request: httpx.Request):
        if not safe_public_url(str(request.url)):
            raise httpx.RequestError(f"Unsafe URL blocked: {request.url}")
            
    with httpx.Client(event_hooks={'request': [check_url]}) as client:
        try:
            response = client.get(source.feed_url, timeout=15, follow_redirects=True, headers={"User-Agent": "AspireOS-CapabilityHub/1.0"})
            response.raise_for_status()
        except httpx.RequestError:
            return 0
            
    content_type = response.headers.get("Content-Type", "").lower()
    allowed_types = ["application/rss+xml", "application/xml", "text/xml", "application/atom+xml"]
    if not any(t in content_type for t in allowed_types):
        return 0
        
    feed = feedparser.parse(response.content)
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

