import Header from './features/commons/Header'
import Home from './features/home/Home'

export default function App() {
  return (
    <div className="min-h-screen bg-green-50 text-green-950 dark:bg-gray-950 dark:text-green-50">
      <Header />
      <Home />
    </div>
  )
}
