(async function(){
 const form=document.getElementById('authForm');const error=document.getElementById('authError');
 let token=(await (await fetch('/api/csrf',{credentials:'same-origin'})).json()).csrf_token;
 form.addEventListener('submit',async function(e){e.preventDefault();error.hidden=true;
  const fields=Object.fromEntries(new FormData(form).entries());
  if(form.dataset.auth==='register'&&fields.password!==fields.confirm_password){error.textContent='Passwords do not match';error.hidden=false;return;}
  const btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Please wait…';
  try{const res=await fetch('/api/auth/'+form.dataset.auth,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':token},body:JSON.stringify({...fields,remember:fields.remember==='on'})});
   const out=await res.json();if(!res.ok)throw new Error(out.error||'Unable to continue');
   window.location.href='/app?view='+(out.user.role==='admin'?'admin-dashboard':out.user.onboarded?'dashboard':'onboarding');
  }catch(err){error.textContent=err.message;error.hidden=false;btn.disabled=false;btn.textContent=form.dataset.auth==='register'?'Register →':'Login →';}
 });
 const forgot=document.getElementById('forgotLink');if(forgot)forgot.addEventListener('click',e=>{e.preventDefault();error.textContent='Password reset is not included in this starter. Ask your group to implement email-based reset before production.';error.hidden=false;});
})();
