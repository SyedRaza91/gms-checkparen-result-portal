import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
async function hash(v:string){const a=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,"0")).join("")}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try{
 const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,secret=Deno.env.get("TURNSTILE_SECRET_KEY");
 const db=createClient(url,key),b=await req.json(),cls=String(b.class_name||"").trim(),exam=String(b.examination_id||"").trim(),kind=String(b.search_type||""),number=String(b.search_number||"").trim(),token=String(b.turnstile_token||"");
 if(!["1st","2nd","3rd","4th","5th","6th","7th","8th"].includes(cls)||!exam||!number||number.length>40||!["admission_number","roll_number"].includes(kind))return reply({error:"Check the class, examination and number."},400);
 if(!secret||!token)return reply({error:"Security verification is not configured."},503);
 const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0].trim()||"unknown";
 const verify=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({secret,response:token,remoteip:ip})});
 if(!(await verify.json()).success)return reply({error:"Security verification failed. Try again."},403);
 const limit=await db.rpc("consume_lookup_attempt",{p_ip_hash:await hash(ip)});if(limit.error||limit.data!==true)return reply({error:"Too many searches. Try again after 10 minutes."},429);
 const {data:s,error:se}=await db.from("students").select("id,admission_number,student_name,father_name,class_name,roll_number").eq("class_name",cls).eq(kind,number).maybeSingle();
 if(se||!s)return reply({error:"No published result matched those details."},404);
 const {data:r,error:re}=await db.from("results").select("subject_marks,total_obtained,total_maximum,percentage,grade,result_status,remarks,examinations(name,academic_year)").eq("student_id",s.id).eq("examination_id",exam).eq("is_published",true).maybeSingle();
 if(re||!r)return reply({error:"No published result matched those details."},404);
 return reply({result:{student_name:s.student_name,father_name:s.father_name,admission_number:s.admission_number,roll_number:s.roll_number,class_name:s.class_name,subject_marks:r.subject_marks,total_obtained:r.total_obtained,total_maximum:r.total_maximum,percentage:r.percentage,grade:r.grade,result_status:r.result_status,remarks:r.remarks,exam_name:r.examinations?.name,academic_year:r.examinations?.academic_year}});
 }catch{return reply({error:"Unable to complete request."},500)}
});