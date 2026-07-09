import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  
  // 🎯 కొత్త ఆర్కిటెక్చర్ కి తగ్గట్టుగా రోల్ మరియు డెలివరీ ఫీల్డ్స్ యాడ్ చేసా బ్రదర్!
  userObj: any = {
    role: 'USER', // డీఫాల్ట్‌గా కస్టమర్ సెలెక్ట్ అయి ఉంటుంది స్వామి
    name: '',
    email: '',
    mobileNumber: '',
    age: null,
    gender: '',
    password: '',
    // ڈెలివరీ కొత్త కాలమ్స్ వేరియబుల్స్ ఇవి బ్రదర్
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    aadhaarNumber: '',
    panNumber: '',
    drivingLicenseNumber: ''
  };

  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(private router: Router, private http: HttpClient) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onRegister() {
    if (this.userObj.email === '' || this.userObj.password === '' || this.userObj.name === '') {
      alert('దయచేసి పేరు, ఈమెయిల్ మరియు పాస్వర్డ్ తప్పకుండా ఎంటర్ చేయండి బ్రదర్!');
      return;
    }

    this.isLoading = true;

    // 🔍 1. ఫస్ట్ బ్యాకెండ్ లో ఈమెయిల్ ఆల్రెడీ ఉందో లేదో కనుక్కుంటుంది బ్రదర్ (ఇక్కడ కొత్త API ఎండ్‌పాయింట్ ఇస్తున్నా స్వామి)
    this.http.get(`${environment.apiUrl}/api/auth/check-email?email=${this.userObj.email}`, { responseType: 'text' })
      .subscribe({
        next: (response: string) => {
          this.isLoading = false;
          
          if (response.trim() === 'exists') {
            alert("❌ ఈమెయిల్ ఆల్రెడీ రిజిస్టర్ అయి ఉంది బ్రదర్! దయచేసి వేరే ఈమెయిల్ ఐడి ఇవ్వండి.");
          } else {
            // 🎉 మెయిల్ కొత్తది అయితే ప్రశాంతంగా నీ పాత లాజిక్ లాగే ఓటీపీ పేజీకి ఈ కొత్త ఎక్స్‌ట్రా డేటాతో సహా మోసుకెళ్తుంది బ్రదర్!
            this.router.navigate(['/otp-verification'], { 
              state: { userData: this.userObj } 
            });
          }
        },
        error: (err) => {
          console.error(err);
          alert("❌ సర్వర్ కనెక్ట్ అవ్వట్లేదు బ్రదర్! స్ప్రింగ్ బూట్ రన్ అవుతుందో లేదో చూడు.");
          this.isLoading = false;
        }
      });
  }
}