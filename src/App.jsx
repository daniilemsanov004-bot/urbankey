import Nav from "./components/Nav";
import BottomNav from "./components/BottomNav";
import OfflineBanner from "./components/OfflineBanner";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Error from "./pages/Error";
import Burger from "./components/Burger";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import Properties from "./pages/Properties";
import Services from "./pages/Services";
import { ToastContainer } from "react-toastify";
import AOS from "aos";
import "aos/dist/aos.css";
import { useContext, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { MyContext } from "./Context";
import Admin from "./pages/Admin";
import CreateCard from "./components/CreateCard";
import ChangeCard from "./components/ChangeCard";
import AdminCards from "./pages/AdminCards";
import PropertyPage from "./pages/PropertyPage";
import CreateVilla from "./components/CreateVilla";
import ScrollToTop from "./components/ScrollToTop";
import ChangeVilla from "./components/ChangeVilla";
import ChangeCommercial from "./components/ChangeCommercial";
import CreateCommercialPage from "./components/CreateCommercialPage";
import CommercialPage from "./pages/CommercialPage";
import EditCommercialPage from "./components/EditCommercialPage";
import ChangeCommercialPage from "./components/ChangeCommercialPage";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import UserProfile from "./components/UserProfile";
import AdminUsers from "./pages/AdminUsers";
import Favorites from "./pages/Favorites";
import AddProperty from "./pages/AddProperty";
import MyListings from "./pages/MyListings";
import AdminLeads from "./pages/AdminLeads";
import TelegramFloatButton from "./components/TelegramFloatButton";
import LeadPopup from "./components/LeadPopup";



const App = () => {

  const { isDark, profile } = useContext(MyContext);
  const isAdmin = profile?.role === "admin";
  useEffect(() => {

    const bodyEl = document.body;

    if (isDark) {
      bodyEl.classList.add("whiteMode");
    } else {
      bodyEl.classList.remove("whiteMode");
    }

  }, [isDark]);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  return (
    <>
      <ScrollToTop />

      <Nav />
      <Burger />
      <BottomNav />
      <OfflineBanner />
      <TelegramFloatButton />
      <LeadPopup />

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/AboutUs" element={<AboutUs />} />
        <Route path="/Properties" element={<Properties />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />
        <Route
          path="/property/:id"
          element={<PropertyPage />}
        />
        <Route
          path="/commercial/:id"
          element={<CommercialPage />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/add-property/:kind/:id" element={<AddProperty />} />
        <Route path="/my-listings" element={<MyListings />} />
        {isAdmin && (
          <>
            <Route
              path="/commercial/edit/:id"
              element={<EditCommercialPage />}
            />
            <Route
              path="/admin/changeCommercialPage"
              element={
                <ChangeCommercialPage />
              }
            />


            <Route
              path="/admin/createCommercialPage"
              element={<CreateCommercialPage />}
            />
            <Route
              path="/admin/createCommercialPage/:id"
              element={<CreateCommercialPage />}
            />
            <Route
              path="/admin/changeCommercial/:id"
              element={<ChangeCommercial />}
            />
            <Route
              path="/admin/cards"
              element={<AdminCards />}
            />

            <Route
              path="/admin/createCard"
              element={<CreateCard />}
            />

            <Route
              path="/admin/changeCard"
              element={<ChangeCard />}
            />

            <Route
              path="/admin/changeCard/:id"
              element={<ChangeCard />}
            />
            <Route

              path="/admin/createVilla"

              element={<CreateVilla />}


            />
            <Route
              path="/admin/CreateVilla/:id"
              element={<CreateVilla />}

            />
            <Route
              path="/admin/changeVilla"
              element={<ChangeVilla />}
            />
            <Route
              path="/admin/leads"
              element={<AdminLeads />}
            />
          </>

        )}
        <Route path="*" element={<Error />} />

      </Routes>
    </>
  );
};

export default App;