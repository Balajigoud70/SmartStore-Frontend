import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './otp-verification.html',
  styleUrl: './otp-verification.css'
})
export class OtpVerificationComponent implements OnInit {
  enteredOtp: string = '';
  userData: any = null;
  
  selectedMode: string = 'email'; 
  isOtpSent: boolean = false;
  isLoading: boolean = false;        
  isVerifying: boolean = false;      
  isAccountCreated: boolean = false;

  constructor(
    private router: Router, 
    private http: HttpClient,
    private cdr: ChangeDetectorRef 
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.userData = navigation.extras.state['userData'];
    }
  }

  ngOnInit() {
    if (!this.userData) {
      alert('రిజిస్ట్రేషన్ డేటా దొరకలేదు బ్రదర్! మళ్లీ మొదటి నుండి రండి.');
      this.router.navigate(['/register']);
    }
  }

  onSendOtp() {
    this.isLoading = true; 
    
    // 🎯 1. కొత్త ఆథెంటికేషన్ API ఎండ్‌పాయింట్‌కి మార్చా బ్రదర్!
    this.http.post(`${environment.apiUrl}/api/auth/register`, this.userData, { responseType: 'text' })
      .subscribe({
        next: (res: string) => {
          this.isLoading = false;
          this.isOtpSent = true; 
          
          this.cdr.detectChanges(); 

          setTimeout(() => {
            alert("🎉 మీ ఈమెయిల్ ఐడి కి OTP విజయవంతంగా పంపాము బ్రదర్! కింద ఎంటర్ చేయండి.");
          }, 50);
        },
        error: (err: any) => {
          console.error(err);
          alert("❌ ఓటీపీ పంపడం ఫెయిల్ అయింది బ్రదర్!");
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onVerifyOtp() {
    if (this.enteredOtp === '') {
      alert('దయచేసి ఓటీపీ ఎంటర్ చేయండి బ్రదర్!');
      return;
    }

    this.isVerifying = true; 
    this.cdr.detectChanges();

    const otpPayload = {
      email: this.userData.email,
      otp: this.enteredOtp
    };

    // 🎯 2. ఓటీపీ వెరిఫికేషన్ ఎండ్‌పాయింట్ కూడా కొత్త దానికి లింక్ చేసా స్వామి!
    this.http.post(`${environment.apiUrl}/api/auth/verify-otp`, null, {
      params: otpPayload,
      responseType: 'text'
    })
    .subscribe({
      next: (response: string) => {
        this.isVerifying = false; 
        const cleanResponse = response.trim();
        
        if (cleanResponse === 'success') {
          this.isAccountCreated = true; 
          this.cdr.detectChanges();
          alert("✅ ఓటీపీ వెరిఫై అయింది & అకౌంట్ సక్సెస్ ఫుల్ గా క్రియేట్ అయింది బ్రదర్!");
          this.router.navigate(['/']); 
        } else {
          alert("❌ " + response);
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.isVerifying = false; 
        alert("❌ ఓటీపీ వెరిఫికేషన్ ఫెయిల్ అయింది బ్రదర్!");
        this.cdr.detectChanges();
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}