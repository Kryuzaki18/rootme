import Header from './features/commons/Header'
import Home from './features/home/Home'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Header />
      <Home />
    </div>
  )
}
