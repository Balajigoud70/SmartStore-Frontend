import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { HomeComponent } from './home'; // 🎯 🌟 స్పేస్ తీసేసాను బ్రదర్, ఇప్పుడు పర్ఫెక్ట్!
import { CartComponent } from './cart/cart.component';
import { RegisterComponent } from './register/register'; 
import { OtpVerificationComponent } from './otp-verification/otp-verification'; 

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'cart', component: CartComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'otp-verification', component: OtpVerificationComponent },
  
  // 🚚 డెలివరీ పార్ట్నర్ రూట్ - నీ అసలైన క్లాస్ నేమ్ 'Delivery' తో మ్యాచ్ చేసా స్వామి!
 // 🚚 డెలివరీ పార్ట్నర్ రౌట్ - క్లాస్ పేరు 'DeliveryComponent' అని పక్కాగా మార్చాను బ్రదర్!
  { path: 'delivery', loadComponent: () => import('./delivery/delivery').then(m => m.DeliveryComponent) },

  // 👑 అడ్మిన్ రౌట్ - దీనికి కూడా కామెంట్ తీసి 'AdminComponent' (లేదా నువ్వు ఏ పేరు పెడితే ఆ పేరు) కరెక్ట్ గా ఇచ్చేయ్ స్వామి
  { path: '**', redirectTo: '' }
];