import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css'
import { InstrumentRegister } from './pages/InstrumentRegisteration';
import { TestingScreen } from './pages/TestingScreen';



const router=createBrowserRouter([
  {
     path:"/",
     element:<InstrumentRegister/>
  },
  {
     path:"/testing/:id",
     element:<TestingScreen/>
  }

])

function App() {
  return <RouterProvider router={router} />;
}

export default App
