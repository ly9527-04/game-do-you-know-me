// Real hydrated UI fixtures plus unauthenticated checks against a running Next build.
// No production data: only /api/account/tests in the local fixture server is simulated.
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { build } = require('esbuild')
const { chromium, expect } = require('@playwright/test')
const root = path.resolve(__dirname, '..')
async function main() {
  const output = process.argv[2]
  if (!output) throw new Error('Pass a screenshot output directory')
  fs.mkdirSync(output, { recursive: true })
  const fixture = await build({
    stdin: { contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {TestBuilder} from './src/components/account/TestBuilder';
      import {Dashboard} from './src/components/account/Dashboard';
      import {MismatchList} from './src/components/results/MismatchList';
      import {ResultScore} from './src/components/results/ResultScore';
      import {QUESTION_POOL} from './src/lib/questions';
      import {scoreAnswers,selectMismatches} from './src/lib/scoring';
      const props={userId:'10000000-0000-4000-8000-000000000001',nickname:'AD钙',account:'00123456',previousTestId:null,questionSetId:'00000000-0000-4000-8000-000000000002',questionSetVersion:2,questions:QUESTION_POOL};
      const answers=Object.fromEntries(QUESTION_POOL.slice(0,25).map(q=>[q.id,'A']));
      const friend=Object.fromEntries(QUESTION_POOL.slice(0,25).map(q=>[q.id,'B']));
      const all=selectMismatches(scoreAnswers(answers,friend,QUESTION_POOL.slice(0,25)),'fixture',undefined,Infinity);
      const current=location.pathname;
      const content=current==='/dashboard'?<Dashboard nickname="AD钙" account="00123456" hasTest={true}/>:current==='/result'?<><ResultScore score={0} verdict="建议重新认识一下。"/><MismatchList mismatches={all}/></>:<TestBuilder {...props} previousTestId={current==='/warning'?'20000000-0000-4000-8000-000000000001':null}/>;
      createRoot(document.getElementById('app')).render(<main className="page-shell">{content}</main>);
    `, resolveDir: root, sourcefile:'account-fixture.tsx', loader:'tsx' },
    bundle:true, write:false, platform:'browser', jsx:'automatic',
    define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'fixture-next',setup(api){
      api.onResolve({filter:/^next\/(navigation|link)$/},args=>({path:args.path,namespace:'fixture'}))
      api.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'jsx',resolveDir:root,contents:args.path.endsWith('/link')
        ? "import React from 'react'; export default function Link({children,...props}){return <a {...props}>{children}</a>}"
        : "export function useRouter(){return {replace:url=>location.assign(url),push:url=>location.assign(url),refresh:()=>location.reload()}}" }))
    }}],
  })
  const css=fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8').replace('@import "tailwindcss";','')
  let submissions=0
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/bundle.js'){res.setHeader('content-type','application/javascript');res.end(fixture.outputFiles[0].text);return}
    if(req.url==='/style.css'){res.setHeader('content-type','text/css');res.end(css);return}
    if(req.url==='/api/account/tests'){
      let raw='';for await(const part of req)raw+=part
      const body=JSON.parse(raw)
      expect(new Set(body.questionIds).size).toBe(25)
      expect(Object.keys(body.answers)).toHaveLength(25)
      expect(body).not.toHaveProperty('userId')
      submissions++
      res.setHeader('content-type','application/json')
      res.statusCode=submissions===1?503:200
      res.end(JSON.stringify(submissions===1?{error:{message:'模拟网络失败，请重试。'}}:{testId:body.testId}))
      return
    }
    res.setHeader('content-type','text/html; charset=utf-8')
    res.end('<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div class="site-frame" id="app"></div><script src="/bundle.js"></script></body></html>')
  })
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const origin='http://127.0.0.1:'+server.address().port
  const browser=await chromium.launch({channel:'msedge',headless:true})
  const report=[]
  try {
    for(const width of [320,390,1280]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'})
      const errors=[]
      page.on('pageerror',error=>errors.push(error.message))
      async function open(url){
        await page.goto(url,{waitUntil:'networkidle'})
        expect(errors).toEqual([])
        await page.locator('body').ariaSnapshot()
      }
      async function shot(name){
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
        await page.screenshot({path:path.join(output,name+'-'+width+'.png'),fullPage:true})
        report.push(name+' '+width+'px: no overflow')
      }
      await open('http://127.0.0.1:3100')
      await expect(page.getByLabel('8位数字账号')).toBeVisible()
      await shot('login')
      await page.getByRole('button',{name:'注册',exact:true}).click()
      await expect(page.getByLabel('确认密码',{exact:true})).toBeVisible()
      await expect(page.getByText('本站暂不支持找回密码，请妥善保存账号密码。')).toBeVisible()
      await shot('register')
      await open('http://127.0.0.1:3100/friend')
      await expect(page).toHaveURL('http://127.0.0.1:3100/')
      await open(origin+'/dashboard')
      await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(3)
      await shot('dashboard')
      await open(origin+'/warning')
      await expect(page.getByText('旧测试和排行榜将被清空')).toBeVisible()
      await shot('replace-warning')
      await open(origin+'/builder')
      await expect(page.getByRole('button',{name:/抽象与想象/})).toBeVisible()
      await shot('categories')
      if(width===390){
        await page.getByRole('button',{name:/抽象与想象/}).click()
        for(const box of await page.getByRole('checkbox').all())await box.check()
        await page.getByRole('button',{name:'返回分类'}).click()
        await page.getByRole('button',{name:/内心与关系/}).click()
        for(const box of await page.getByRole('checkbox').all())await box.check()
        await expect(page.getByRole('status')).toHaveText('已选 25 / 25 题')
        await shot('selected')
        await page.getByRole('button',{name:'选好了，开始回答'}).click()
        for(let i=0;i<7;i++){
          await expect(page.locator('.quiz-progress__count')).toHaveText(String(i+1).padStart(2,'0')+' / 25')
          await page.getByRole('button',{name:/^A：/}).click()
        }
        await page.reload({waitUntil:'networkidle'})
        await page.locator('body').ariaSnapshot()
        await expect(page.locator('.quiz-progress__count')).toHaveText('08 / 25')
        await shot('quiz-resumed')
        for(let i=7;i<25;i++){
          await expect(page.locator('.quiz-progress__count')).toHaveText(String(i+1).padStart(2,'0')+' / 25')
          await page.getByRole('button',{name:/^A：/}).click()
        }
        await expect(page.getByRole('alert')).toBeVisible()
        await page.getByRole('button',{name:'重试提交'}).click()
        await expect(page.getByRole('heading',{name:'谁最懂你，等朋友来揭晓'})).toBeVisible()
        expect(submissions).toBe(2)
        await shot('created')
      }
      await open(origin+'/result')
      await expect(page.getByRole('article')).toHaveCount(3)
      await page.getByRole('button',{name:/查看更多/}).click()
      await expect(page.getByRole('article')).toHaveCount(25)
      await shot('all-differences')
      await page.getByRole('button',{name:'收起',exact:true}).click()
      await expect(page.getByRole('article')).toHaveCount(3)
      expect(errors).toEqual([])
      await page.close()
    }
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({report,submissions,scope:'Live Next login/protected entry + isolated hydrated business components; API save simulated. No live Supabase.'},null,2))
    console.log(report.join('\n'))
    console.log('PASS: live login gate, 3 lobby actions, free25 selection, draft refresh, failed submit retry, 3/all mismatch toggle; no page errors.')
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(error=>{console.error(error);process.exitCode=1})
