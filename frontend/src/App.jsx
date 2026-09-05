import Navbar from './navbar'
import './App.css'
import Sidebar from './student/pages/sidebar';
function App() {
  return (
    <div className="min-h-screen bg-[#0e1322] text-gray-300">
      <Navbar />
      {/*student routes */}
      <div className="flex">
        <Sidebar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to LabDynamix</h1>
          <p className="text-gray-400">
            Your all-in-one platform for managing lab equipment and bookings.
          </p>
        </main>
      </div>
    </div>
  );
}

export default App

  
 
