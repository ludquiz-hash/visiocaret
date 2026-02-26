import Billing from './pages/Billing';
import ClaimDetail from './pages/ClaimDetail';
import ClaimWizard from './pages/ClaimWizard';
import Claims from './pages/Claims';
import Dashboard from './pages/Dashboard';
import GarageSettings from './pages/GarageSettings';
import Landing from './pages/Landing';
import Legal from './pages/Legal';
import Login from './pages/Login';
import NativeTest from './pages/NativeTest';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import QAChecklist from './pages/QAChecklist';
import Settings from './pages/Settings';
import StripeTest from './pages/StripeTest';
import Team from './pages/Team';
import Terms from './pages/Terms';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Billing": Billing,
    "ClaimDetail": ClaimDetail,
    "ClaimWizard": ClaimWizard,
    "Claims": Claims,
    "Dashboard": Dashboard,
    "GarageSettings": GarageSettings,
    "Landing": Landing,
    "Legal": Legal,
    "Login": Login,
    "NativeTest": NativeTest,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "QAChecklist": QAChecklist,
    "Settings": Settings,
    "StripeTest": StripeTest,
    "Team": Team,
    "Terms": Terms,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};
