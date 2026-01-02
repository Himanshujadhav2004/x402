"use client";
import { Home, TrendingUp, Bot, LayoutDashboard } from 'lucide-react'

import { NavBar } from './ui/tubelight-navbar';

const LandingNav = () => {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Market', url: '/market', icon: TrendingUp },
    { name: 'Agents', url: '/agents', icon: Bot },
    { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }
  ]

  return <NavBar items={navItems} />
}

export default LandingNav;
