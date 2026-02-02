import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Upload from './pages/Upload'
import Goals from './pages/Goals'
import Categories from './pages/Categories'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/categories" element={<Categories />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
