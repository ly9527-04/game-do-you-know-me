import { EventBeacon } from '@/components/analytics/EventBeacon'
import { HomeActions } from '@/components/home/HomeActions'

export default function HomePage() {
  return (
    <main className="home-page page-shell">
      <EventBeacon eventName="homepage_view" metadata={{ source: 'home', surface: 'hero' }} />
      <div className="home-orbit" aria-hidden="true"><span>?</span><i className="fa-solid fa-bolt" /></div>
      <p className="eyebrow">FRIENDSHIP CHALLENGE · 默契挑战</p>
      <h1>你朋友真的懂你吗？</h1>
      <p className="lede">回答 25 道小题，邀请朋友来猜猜你。看看他们眼里的你，和真正的你，差几道题。</p>
      <ul className="home-page__facts" aria-label="测试说明">
        <li>无需注册</li>
        <li>25 道题</li>
        <li>约 3 分钟</li>
      </ul>
      <HomeActions />
      <p className="home-page__note">你先作答 → 发给朋友 → 揭晓默契</p>
    </main>
  )
}
