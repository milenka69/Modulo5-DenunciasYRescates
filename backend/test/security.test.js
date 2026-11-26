import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

test('cookie sessions, CSRF, permissions, revocation and throttling', async t => {
  let profile = 'vecino', revoked = false
  const core = createServer(async (req, res) => {
    let text = ''
    for await (const chunk of req) text += chunk
    const body = text ? JSON.parse(text) : {}
    res.setHeader('Content-Type', 'application/json')
    if (req.method === 'POST' && body.clave !== 'correcta') {
      res.writeHead(401); res.end(JSON.stringify({error:{codigo:'USUARIO_NO_ENCONTRADO'}})); return
    }
    if (revoked) { res.writeHead(401); res.end('{}'); return }
    res.end(JSON.stringify({token:'secret-core-token',rut:'11111111-1',nombre:'Test',perfil:profile,expira:new Date(Date.now()+60000).toISOString()}))
  })
  core.listen(0, '127.0.0.1'); await once(core, 'listening')
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe,'listening')
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve))
  const child = spawn(process.execPath, ['src/server.js'], {cwd:new URL('..',import.meta.url), env:{...process.env,PORT:String(port),NUCLEO_URL:`http://127.0.0.1:${core.address().port}`,MONGODB_URI:'',NODE_ENV:'test',FRONTEND_URL:'http://localhost:5173'}})
  t.after(() => { child.kill(); core.close() })
  await Promise.race([once(child.stdout,'data'), once(child,'exit').then(() => {throw new Error('Backend failed to start')})])
  const base = `http://127.0.0.1:${port}/api/auth/sesiones`
  const headers = {'Content-Type':'application/json',Origin:'http://localhost:5173','X-Requested-With':'Modulo5'}
  const login = (body, extra = {}) => fetch(base,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)})
  const valid = {rut:'11111111-1',clave:'correcta'}
  assert.equal((await login(valid,{Origin:'https://evil.example'})).status,403)
  assert.equal((await login({...valid,clave:{}})).status,400)
  const bad = await login({...valid,clave:'incorrecta'})
  assert.equal(bad.status,401); assert.equal((await bad.json()).error.codigo,'CREDENCIALES_INVALIDAS')
  let result = await login({...valid,recordar:true})
  assert.equal(result.status,201)
  const setCookie = result.headers.get('set-cookie')
  assert.match(setCookie,/HttpOnly/); assert.match(setCookie,/SameSite=Strict/); assert.match(setCookie,/Max-Age=/)
  assert.equal((await result.json()).token,undefined)
  const Cookie = setCookie.split(';')[0]
  const current = await fetch(base+'/actual',{headers:{Cookie}})
  assert.equal(current.status,200)
  assert.equal((await current.json()).token,undefined)
  profile = 'admin'
  assert.equal((await fetch(base+'/actual',{headers:{Cookie}})).status,403)
  profile = 'vecino'
  assert.equal((await fetch(base+'/actual',{headers:{Authorization:'Bearer secret-core-token'}})).status,401)
  assert.equal((await fetch(base+'/actual',{method:'DELETE',headers:{Cookie}})).status,403)
  assert.equal((await fetch(base+'/actual',{method:'DELETE',headers:{...headers,Cookie}})).status,204)
  assert.equal((await fetch(base+'/actual',{headers:{Cookie}})).status,401)
  result = await login(valid)
  assert.doesNotMatch(result.headers.get('set-cookie'),/Max-Age=/)
  revoked = true
  assert.equal((await fetch(base+'/actual',{headers:{Cookie:result.headers.get('set-cookie').split(';')[0]}})).status,401)
  let limited
  for (let i=0;i<12;i++) limited = await login(valid)
  assert.equal(limited.status,429); assert.ok(Number(limited.headers.get('retry-after'))>0)
})

test('production refuses insecure upstream configuration', async () => {
  const child = spawn(process.execPath,['src/server.js'],{cwd:new URL('..',import.meta.url),env:{...process.env,NODE_ENV:'production',NUCLEO_URL:'http://localhost:3000',FRONTEND_URL:'http://localhost:5173'}})
  child.stderr.resume()
  const [code] = await once(child,'exit')
  assert.notEqual(code,0)
})
