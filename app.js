(()=>{const c=APP_CONFIG,$=id=>document.getElementById(id),classes=["1st","2nd","3rd","4th","5th","6th","7th","8th"];let db,admin,items=[],staged=[];
const ready=c.SUPABASE_URL.startsWith("https://")&&c.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_");if(ready)db=supabase.createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY);
$("year").textContent=new Date().getFullYear();classes.forEach(x=>$("publicClass").add(new Option(x,x)));
if(c.TURNSTILE_SITE_KEY.startsWith("0x")){const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js";s.async=true;s.defer=true;document.head.append(s);$("turnstile").innerHTML=`<div class="cf-turnstile" data-sitekey="${c.TURNSTILE_SITE_KEY}"></div>`}
const esc=x=>String(x??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const say=(id,t,ok=false)=>{$(id).textContent=t;$(id).style.color=ok?"#147443":"#a33"};
const grade=p=>p>=90?"A+":p>=80?"A":p>=70?"B":p>=60?"C":p>=50?"D":p>=33?"E":"F";
async function exams(){if(!db)return;let {data,error}=await db.from("examinations").select("id,name,academic_year").order("created_at",{ascending:false});if(error)return;const s=$("publicExam");s.innerHTML='<option value="">Select examination</option>';data.forEach(x=>s.add(new Option(`${x.name} (${x.academic_year})`,x.id)));$("examList").innerHTML=data.map(x=>`<p>${esc(x.name)} · ${esc(x.academic_year)} <button type="button" data-id="${x.id}" class="delete-exam" style="background:#a33;color:white">Delete</button></p>`).join("")||"No examinations yet.";document.querySelectorAll(".delete-exam").forEach(b=>b.onclick=()=>deleteExam(b.dataset.id))}
$("adminOpen").onclick=()=>ready?$("loginDialog").showModal():alert("Configure Supabase first. See SETUP.md.");$("closeLogin").onclick=()=>$("loginDialog").close();
$("loginForm").onsubmit=async e=>{e.preventDefault();say("loginMessage","Signing in...",true);let {data,error}=await db.auth.signInWithPassword({email:$("loginEmail").value,password:$("loginPassword").value});if(error)return say("loginMessage",error.message);admin=data.user;$("loginDialog").close();await dashboard()};
$("logoutBtn").onclick=async()=>{await db.auth.signOut();admin=null;$("adminPanel").classList.add("hidden")};
async function dashboard(){if(!admin)return;let {data:allow,error}=await db.from("admin_users").select("user_id").eq("user_id",admin.id).maybeSingle();if(error||!allow){await db.auth.signOut();admin=null;return alert("This account is not authorised as the school administrator.")}$("adminPanel").classList.remove("hidden");$("adminEmail").textContent=admin.email||"";await refresh()}
async function refresh(){let [s,r]=await Promise.all([db.from("students").select("id",{count:"exact",head:true}),db.from("results").select("id,is_published,students(student_name,class_name,roll_number),examinations(name)",{count:"exact"}).order("created_at",{ascending:false}).limit(100)]);if(s.error||r.error)return say("uploadMessage",s.error?.message||r.error?.message);items=r.data||[];$("studentCount").textContent=s.count||0;$("resultCount").textContent=r.count||0;$("publishedCount").textContent=items.filter(x=>x.is_published).length;$("adminRows").innerHTML=items.map(x=>`<tr><td>${esc(x.students?.student_name)}</td><td>${esc(x.students?.class_name)}</td><td>${esc(x.examinations?.name)}</td><td>${esc(x.students?.roll_number)}</td><td>${x.is_published?"Published":"Draft"}</td><td><button data-id="${x.id}" class="toggle">${x.is_published?"Unpublish":"Publish"}</button> <button type="button" data-id="${x.id}" class="delete-result" style="background:#a33;color:white">Delete</button></td></tr>`).join("");document.querySelectorAll(".toggle").forEach(b=>b.onclick=()=>publish(b.dataset.id));document.querySelectorAll(".delete-result").forEach(b=>b.onclick=()=>deleteResult(b.dataset.id));await exams()}
async function deleteResult(id){if(!confirm("Permanently delete this result? This cannot be undone."))return;const {error}=await db.from("results").delete().eq("id",id);if(error)alert(error.message);else await refresh()}
async function deleteExam(id){if(!confirm("Permanently delete this examination AND ALL results linked to it? This cannot be undone."))return;const {error}=await db.from("examinations").delete().eq("id",id);if(error)alert(error.message);else await refresh()}
async function publish(id){const x=items.find(y=>y.id===id),next=!x.is_published;const {error}=await db.from("results").update({is_published:next,published_at:next?new Date().toISOString():null}).eq("id",id);if(error)alert(error.message);else await refresh()}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".tabcontent").forEach(x=>x.classList.add("hidden"));$("tab-"+b.dataset.tab).classList.remove("hidden")});
$("examForm").onsubmit=async e=>{e.preventDefault();let {error}=await db.from("examinations").insert({name:$("examName").value.trim(),academic_year:$("examYear").value.trim()});if(error)alert(error.message);else{$("examName").value="";await exams()}};
function validate(r,n){let x={...r,line:n,error:""};for(let k of ["exam_name","academic_year","class_name","roll_number","admission_number","student_name","father_name","subject_marks"])if(!String(x[k]??"").trim()){x.error=`Row ${n}: missing ${k}`;return x}if(!classes.includes(String(x.class_name).trim())){x.error=`Row ${n}: invalid class`;return x}try{x.subject_marks=typeof x.subject_marks==="string"?JSON.parse(x.subject_marks):x.subject_marks;if(!x.subject_marks||Array.isArray(x.subject_marks)||!Object.keys(x.subject_marks).length)throw 0;for(let [k,m] of Object.entries(x.subject_marks)){if(!Number.isFinite(+m.obtained)||!Number.isFinite(+m.maximum)||+m.maximum<=0||+m.obtained<0||+m.obtained>+m.maximum)throw 0;x.subject_marks[k]={obtained:+m.obtained,maximum:+m.maximum}}}catch{x.error=`Row ${n}: subject_marks must be valid JSON with obtained and maximum values`}return x}
$("excelFile").onchange=async e=>{try{let f=e.target.files[0];if(!f)return;let w=XLSX.read(await f.arrayBuffer(),{type:"array"});staged=XLSX.utils.sheet_to_json(w.Sheets[w.SheetNames[0]],{defval:""}).map((r,i)=>validate(r,i+2));$("previewWrap").classList.remove("hidden");$("previewSummary").textContent=`${staged.filter(x=>!x.error).length} valid rows, ${staged.filter(x=>x.error).length} rows with errors.`;$("previewRows").innerHTML=staged.slice(0,100).map(x=>`<tr><td>${esc(x.student_name)}</td><td>${esc(x.class_name)}</td><td>${esc(x.exam_name)}</td><td>${esc(x.error||"Ready")}</td></tr>`).join("");$("importBtn").disabled=!staged.some(x=>!x.error)}catch(e){say("uploadMessage","Could not read file: "+e.message)}};
$("importBtn").onclick=async()=>{let saved=0,errs=[];$("importBtn").disabled=true;for(let x of staged.filter(x=>!x.error)){let {data:ex,error:ee}=await db.from("examinations").select("id").eq("name",String(x.exam_name).trim()).eq("academic_year",String(x.academic_year).trim()).maybeSingle();if(ee){errs.push(`Row ${x.line}: ${ee.message}`);continue}if(!ex){let z=await db.from("examinations").insert({name:String(x.exam_name).trim(),academic_year:String(x.academic_year).trim()}).select("id").single();if(z.error){errs.push(`Row ${x.line}: ${z.error.message}`);continue}ex=z.data}let st=await db.from("students").upsert({admission_number:String(x.admission_number).trim(),student_name:String(x.student_name).trim(),father_name:String(x.father_name).trim(),class_name:String(x.class_name).trim(),roll_number:String(x.roll_number).trim()},{onConflict:"admission_number"}).select("id").single();if(st.error){errs.push(`Row ${x.line}: ${st.error.message}`);continue}let a=Object.values(x.subject_marks).reduce((v,m)=>v+m.obtained,0),b=Object.values(x.subject_marks).reduce((v,m)=>v+m.maximum,0),p=b?+(a/b*100).toFixed(2):0;let z=await db.from("results").upsert({student_id:st.data.id,examination_id:ex.id,subject_marks:x.subject_marks,total_obtained:a,total_maximum:b,percentage:p,grade:grade(p),result_status:p>=33?"Pass":"Needs Improvement",remarks:String(x.remarks||""),is_published:false},{onConflict:"student_id,examination_id"});if(z.error)errs.push(`Row ${x.line}: ${z.error.message}`);else saved++}say("uploadMessage",`Saved ${saved} draft result(s). ${errs.slice(0,4).join(" | ")}`,!errs.length);await refresh()};
$("lookupForm").onsubmit=async e=>{e.preventDefault();$("resultCard").classList.add("hidden");say("lookupMessage","Searching...",true);if(!db)return say("lookupMessage","Portal configuration is incomplete.");let token=window.turnstile?.getResponse?.()||"";if(!token)return say("lookupMessage","Complete the security verification first.");let {data,error}=await db.functions.invoke("public-result",{body:{class_name:$("publicClass").value,examination_id:$("publicExam").value,search_type:$("searchType").value,search_number:$("searchNumber").value.trim(),turnstile_token:token}});window.turnstile?.reset?.();if(error||!data?.result)return say("lookupMessage",data?.error||"No published result matched those details.");say("lookupMessage","Published result found.",true);showResult(data.result)};
function showResult(r){
  let marks=Object.entries(r.subject_marks||{});
  $("resultCard").innerHTML=`
  <style>
    .school-sheet{
      background:#fff;
      color:#17233b;
      border:2px solid #183b67;
      padding:25px;
      font-family:Arial,sans-serif;
      max-width:850px;
      margin:20px auto;
    }
    .school-header{
      text-align:center;
      border-bottom:4px double #c49a36;
      padding-bottom:15px;
    }
    .school-header img{
      width:85px;
      height:85px;
      object-fit:contain;
      margin-bottom:8px;
    }
    .school-header h2{
      color:#173d68;
      margin:5px 0;
      font-size:25px;
    }
    .school-header p{margin:4px;color:#555}
    .sheet-title{
      background:#173d68;
      color:white;
      padding:12px;
      text-align:center;
      margin:18px 0;
      border-radius:5px;
    }
    .student-info{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin:15px 0;
    }
    .student-info div{
      background:#f0f5fb;
      border-left:4px solid #c49a36;
      padding:10px;
    }
    .student-info small{
      display:block;
      color:#667085;
      margin-bottom:4px;
    }
    .school-sheet table{
      width:100%;
      border-collapse:collapse;
      margin-top:18px;
    }
    .school-sheet th{
      background:#173d68;
      color:white;
      padding:11px;
    }
    .school-sheet td{
      border:1px solid #ccd5e0;
      padding:10px;
      text-align:center;
    }
    .school-sheet tbody tr:nth-child(even){
      background:#f0f5fb;
    }
    .result-summary{
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:10px;
      margin-top:18px;
    }
    .result-summary div{
      background:#eaf1f9;
      border:1px solid #c49a36;
      padding:13px 5px;
      text-align:center;
      border-radius:5px;
    }
    .result-summary strong{
      display:block;
      color:#173d68;
      font-size:20px;
      margin-top:5px;
    }
    .signatures{
      display:flex;
      justify-content:space-between;
      margin-top:65px;
      text-align:center;
      gap:20px;
    }
    .signatures div{
      width:45%;
      border-top:1px solid #333;
      padding-top:8px;
    }
    .print{margin-bottom:15px}
    @media print{
      body *{visibility:hidden!important}
      #resultCard,#resultCard *{visibility:visible!important}
      #resultCard{
        position:absolute;
        left:0;
        top:0;
        width:100%;
        margin:0;
      }
      .print{display:none!important}
      .school-sheet{
        border:2px solid #173d68;
        margin:0;
        max-width:none;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      }
    }
  </style>

  <button class="primary print" onclick="window.print()">Print Marksheet</button>

  <div class="school-sheet">
    <div class="school-header">
      <img src="/assets/school-logo.jpg" alt="School Logo"
           onerror="this.style.display='none'">
      <h2>GOVERNMENT MIDDLE SCHOOL CHECKPAREN</h2>
      <p>Zone Mawer, District Kupwara, Jammu & Kashmir</p>
      <h3 style="color:#b18a2c">STUDENT PERFORMANCE REPORT</h3>
    </div>

    <div class="sheet-title">
      <h3>${esc(r.exam_name)} - ${esc(r.academic_year)}</h3>
      <b>OFFICIAL MARKSHEET</b>
    </div>

    <div class="student-info">
      ${[
        ["Student Name",r.student_name],
        ["Father's Name",r.father_name],
        ["Class",r.class_name],
        ["Roll Number",r.roll_number],
        ["Admission Number",r.admission_number],
        ["Result Status",r.result_status]
      ].map(([a,b])=>`<div><small>${a}</small><b>${esc(b)}</b></div>`).join("")}
    </div>

    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Maximum Marks</th>
          <th>Marks Obtained</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody>
        ${marks.map(([s,m])=>`
          <tr>
            <td>${esc(s)}</td>
            <td>${m.maximum}</td>
            <td>${m.obtained}</td>
            <td>${grade(m.obtained/m.maximum*100)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="result-summary">
      <div>Total Marks<strong>${r.total_obtained}/${r.total_maximum}</strong></div>
      <div>Percentage<strong>${Number(r.percentage).toFixed(2)}%</strong></div>
      <div>Overall Grade<strong>${esc(r.grade)}</strong></div>
    </div>

    <p style="margin-top:20px"><b>Remarks:</b> ${esc(r.remarks||"—")}</p>

    <div class="signatures">
      <div>Class Teacher</div>
      <div>Head of Institution</div>
    </div>

    <p style="text-align:center;margin-top:25px;color:#777;font-size:11px">
      Computer-generated marksheet. For any discrepancy, contact the school office.
    </p>
  </div>`;

  $("resultCard").classList.remove("hidden");
  $("resultCard").scrollIntoView({behavior:"smooth"});
}
db?.auth.getSession().then(({data})=>{if(data.session){admin=data.session.user;dashboard()}});exams();
})();
