const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
export type Content = {id:number;title:string;abstract:string;canonical_url:string;topics:string[];resource_type:string;licence:string;language:string;published_at:string|null};
export type Skill = {id:number;name:string;category:string;description:string;code:string};
export type Gap = {skill:string;current:number;target:number;gap:number;confidence:number};
export type Milestone = {title:string;status:string};
export type LearningPlan = {id:number;title:string;status:string;progress:number;milestones:Milestone[]};
export type Digest = {cadence:string;stakeholder:string;generated_at:string;updates:{title:string;url:string;topics:string[];source:string}[];priority_skill_gaps:Gap[];recommended_action:string};
export type AssessmentIn = {skill_id:number;current_level:number;target_level:number;confidence?:number;evidence_url?:string};
export type FeedbackIn = {content_id?:number|null;useful:boolean;note?:string};
export async function login(email:string,password:string){const body=new URLSearchParams();body.append('username',email);body.append('password',password);const r=await fetch(`${BASE}/auth/login`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw new Error('Login failed');return r.json()}
export async function api<T>(path:string):Promise<T>{const token=localStorage.getItem('token');const r=await fetch(`${BASE}${path}`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok)throw new Error(`Request failed: ${r.status}`);return r.json()}
export async function apiPut<T>(path:string, body: any):Promise<T>{const token=localStorage.getItem('token');const r=await fetch(`${BASE}${path}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});if(!r.ok)throw new Error(`Request failed: ${r.status}`);return r.json()}
export async function apiPost<T>(path:string, body: any):Promise<T>{const token=localStorage.getItem('token');const r=await fetch(`${BASE}${path}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});if(!r.ok)throw new Error(`Request failed: ${r.status}`);return r.json()}

export interface SkillGapAnalytics { skill_id: number; skill_name: string; average_gap: number; }
export interface ContentAnalytics { status: string; count: number; }
export interface FeedbackAnalytics { total_feedback: number; useful_feedback: number; usefulness_percentage: number | null; }
export interface LearningPlanAnalytics { active_plan_count: number; average_progress: number | null; }

