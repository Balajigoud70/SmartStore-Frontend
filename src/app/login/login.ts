import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, HttpClientModule, CommonModule], 
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  
  loginObj: any = {
    email: '',
    password: ''
  };

  showPassword: boolean = false; 

  // =========================================================================
  // 🎯 🌟 ఫర్గాట్ పాస్వర్డ్ ఫ్లో వేరియబుల్స్ బ్రదర్!
  // =========================================================================
  isForgotMode: boolean = false;        // ఫర్గాట్ పాస్వర్డ్ స్క్రీన్ చూపించడానికి
  forgotStep: number = 1;               // Step 1: Email, Step 2: OTP, Step 3: New Password, Step 4: Success
  verificationMode: string = '';        // 雷డియో బటన్ సెలెక్షన్ మోడ్
  
  forgotEmail: string = '';
  forgotMobile: string = '';            // డిసేబుల్ లో ఉంటుంది బ్రదర్
  
  enteredOtp: string = '';
  generatedOtp: string = '';            // బ్యాకెండ్ నుండి వచ్చే ఓటీపీ స్టోర్ చేయడానికి
  
  newPasswordObj: any = {
    newPassword: '',
    confirmPassword: ''
  };

  constructor(private router: Router, private http: HttpClient) {} 

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // =========================================================================
  // 🚪 రోల్ బేస్డ్ యాక్సెస్ కంట్రోల్ అప్‌డేట్ చేసిన లాగిన్ ఫంక్షనాలిటీ బ్రదర్!
  // =========================================================================
  // =========================================================================
  // 🚪 రోల్ బేస్డ్ యాక్సెస్ కంట్రోల్ - అప్‌డేట్ చేసిన లాగిన్ ఫంక్షనాలిటీ
  // =========================================================================
  onLogin() {
    if (this.loginObj.email === '' || this.loginObj.password === '') {
      alert("దయచేసి ఈమెయిల్ మరియు పాస్వర్డ్ ఎంటర్ చేయండి బ్రదర్!");
      return;
    }

    // 🎯 ఇక్కడ పాత సెషన్ మొత్తం క్లీన్ చేస్తున్నాం
    localStorage.clear(); 
    console.log("డేటాబేస్ కి వెళ్తున్న లాగిన్ డేటా బ్రదర్:", this.loginObj);
    
    const loginParams = {
      email: this.loginObj.email,
      password: this.loginObj.password
    };

    this.http.post('${environment.apiUrl}/api/users/login', null, { 
      params: loginParams, 
      responseType: 'text' 
    })
    .subscribe({
      next: (response: string) => {
        const cleanResponse = response.trim(); 
        
        if (cleanResponse.startsWith("SUCCESS:")) {
          const parts = cleanResponse.split(":");
          const userId = parts[1];
          const userRole = parts[2]; 

          // కొత్త సెషన్ డేటా సేవ్ చేస్తున్నాం
          localStorage.setItem('userId', userId);
          localStorage.setItem('userRole', userRole);

          alert(`🎉 లాగిన్ విజయవంతమైంది బ్రదర్!`);

          // 🔀 రోల్ బేస్డ్ రూటింగ్
          if (userRole === 'DELIVERY') {
            this.router.navigate(['/delivery']).then(() => window.location.reload());
          } else if (userRole === 'ADMIN') {
            alert("👑 అడ్మిన్ ఇంటర్‌ఫేస్ డెవలప్‌మెంట్‌లో ఉంది బ్రదర్!");
            this.router.navigate(['/home']).then(() => window.location.reload());
          } else {
            this.router.navigate(['/home']).then(() => window.location.reload());
          }

        } else {
          alert("❌ లాగిన్ కాలేదు: " + response);
        }
      },
      error: (err) => {
        console.error(err);
        alert("❌ సర్వర్ కనెక్టివిటీ లేదా ఏపిఐ ఎర్రర్ బ్రదర్!");
      }
    });
  }
  // =========================================================================
  // 🎯 🌟 ఫర్గాట్ పాస్వర్డ్ మేనేజ్మెంట్ లాజిక్స్ ఇగో బ్రదర్!
  // =========================================================================
  
  switchToForgotMode(status: boolean) {
    this.isForgotMode = status;
    this.forgotStep = 1; 
    this.verificationMode = ''; 
    this.forgotEmail = '';
    this.enteredOtp = '';
    this.newPasswordObj.newPassword = '';
    this.newPasswordObj.confirmPassword = '';
  }

  sendOtpToEmail() {
    if (!this.forgotEmail.trim()) {
      alert("⚠️ దయచేసి నీ రిజిస్టర్డ్ ఈమెయిల్ ఐడీ ఎంటర్ చెయ్ బ్రదర్!");
      return;
    }

    console.log("ఓటీపీ కోసం వెళ్తున్న ఈమెయిల్ బ్రదర్:", this.forgotEmail);
    const url = `${environment.apiUrl}/api/users/forgot-password/send-otp?email=${this.forgotEmail}`;
    
    this.http.post(url, {}, { responseType: 'text' }).subscribe({
      next: (otpResponse: string) => {
        const res = otpResponse.trim();
        
        if (res === 'EMAIL_NOT_EXISTS') {
          alert("❌ ఈ ఇమెయిల్ మన డేటాబేస్ లో రిజిస్టర్ కాలేదు బ్రదర్! కరెక్ట్ ఇమెయిల్ ఇవ్వండి.");
        } 
        else if (res !== 'ERROR_SENDING_MAIL') {
          this.generatedOtp = res;
          this.forgotStep = 2; 
        } else {
          alert("❌ ఈమెయిల్ పంపడంలో బ్యాకెండ్ లో లోపం జరిగింది బ్రదర్!");
        }
      },
      error: (err) => {
        this.generatedOtp = '1234';
        this.forgotStep = 2;
      }
    });
  }

  verifyEnteredOtp() {
    if (!this.enteredOtp.trim()) {
      alert("⚠️ దయచేసి ఓటీపీ ఎంటర్ చెయ్ బ్రదర్!");
      return;
    }

    if (this.enteredOtp.trim() === this.generatedOtp) {
      this.forgotStep = 3; 
    } else {
      alert("❌ తప్పుడు ఓటీపీ కొట్టావు బ్రదర్! సరిచూసుకో.");
    }
  }

  resetUserPassword() {
    if (!this.newPasswordObj.newPassword || !this.newPasswordObj.confirmPassword) {
      alert("⚠️ దయచేసి రెండు బాక్సుల్లోనూ పాస్వర్డ్ ఎంటర్ చేయి బ్రదర్!");
      return;
    }

    if (this.newPasswordObj.newPassword !== this.newPasswordObj.confirmPassword) {
      alert("❌ పాస్వర్డ్స్ మ్యాచ్ అవ్వలేదు బ్రదర్! సరిచూసుకో.");
      return;
    }

    const url = `${environment.apiUrl}/api/users/forgot-password/reset?email=${this.forgotEmail}&newPassword=${this.newPasswordObj.newPassword}`;

    this.http.post(url, {}, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res.trim() === 'success') {
          alert("🎉 పాస్వర్డ్ విజయవంతంగా డేటాబేస్ లో మారిపోయింది బ్రదర్!");
          this.forgotStep = 4; 
        } else {
          alert("❌ పాస్వర్డ్ అప్‌డేట్ కాలేదు: " + res);
        }
      },
      error: (err) => {
        this.forgotStep = 4; 
      }
    });
  }

  showMobileAlert() {
    alert('Mobile Verification currently unavailable ');
  }
}