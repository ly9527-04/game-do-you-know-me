import { EventBeacon } from '@/components/analytics/EventBeacon'
import { HomeActions } from '@/components/home/HomeActions'

export default function HomePage() {
  return (
    <main className="home-page page-shell">
      <EventBeacon eventName="homepage_view" metadata={{ source: 'home', surface: 'hero' }} />
      <p className="eyebrow">朋友手帐 · 一张关于你的观察卡</p>
      <h1>你朋友真的懂你吗？</h1>
      <p className="lede">回答 25 道小题，邀请朋友来猜猜你。看看他们眼里的你，和真正的你，差几道题。</p>
      <HomeActions />
    </main>
  )
}
