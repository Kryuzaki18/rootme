import Header from './features/commons/Header'
import Home from './features/home/Home'
import ToastViewport from './components/ToastViewport'

export default function App() {
  return (
    <div className="flex h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <Header />
      <Home />
      <ToastViewport />
    </div>
  )
}
