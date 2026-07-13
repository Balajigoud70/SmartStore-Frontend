import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { HttpClient } from '@angular/common/http'; 
import { CartService } from '../cart'; 
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  voucherCode: string = '';
  discount: number = 0;
  
  itemTotal: number = 0;
  deliveryCharge: number = 40;
  gstTax: number = 0;
  grandTotal: number = 0;
  
  showPaymentOptions: boolean = false;
  paymentMode: string = 'COD'; 

  walletBalance: number = 0.0;
  loggedInUserId: number = 1;

  userAddresses: any[] = []; 
  selectedAddressId: number | null = null; 

  constructor(
    private cartService: CartService, 
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    const savedId = localStorage.getItem('userId');
    if (savedId) {
      this.loggedInUserId = Number(savedId);
    }

    this.cartItems = this.cartService.getCartItems();
    if (!this.cartItems || this.cartItems.length === 0) {
      this.router.navigate(['/home']); 
    }
    
    this.calculateBill();
    this.loadUserWalletBalance(); 
    this.loadUserAddresses(); 
  }

  loadUserAddresses() {
    this.http.get<any[]>(`${environment.apiUrl}/api/addresses/user/${this.loggedInUserId}`).subscribe({
      next: (data) => {
        this.userAddresses = data || [];
        if (this.userAddresses.length > 0) {
          this.selectedAddressId = this.userAddresses[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err) => { console.error("Failed to load addresses inside cart:", err); }
    });
  }

  loadUserWalletBalance() {
    this.http.get<any>(`${environment.apiUrl}/api/users/profile?userId=${this.loggedInUserId}`).subscribe({
      next: (data) => {
        if (data) {
          this.walletBalance = data.walletBalance || 0.0;
          this.cdr.detectChanges();
        }
      },
      error: (err) => { console.error("Failed to load wallet inside cart:", err); }
    });
  }

  calculateBill() {
    this.itemTotal = this.cartItems.reduce((sum, item) => sum + (item.selectedQty * item.price), 0);
    this.deliveryCharge = this.itemTotal > 500 ? 0 : 40;
    this.gstTax = Math.round(this.itemTotal * 0.05);
    this.grandTotal = (this.itemTotal + this.deliveryCharge + this.gstTax) - this.discount;
  }

  applyVoucher() {
    if (this.voucherCode.toUpperCase() === 'SMART50') {
      if (this.itemTotal >= 200) {
        this.discount = 50; 
        this.calculateBill();
        alert('🎉 Promo Code SMART50 applied successfully!');
      } else {
        alert('Minimum shopping amount to apply this voucher is ₹200!');
      }
    } else {
      alert('Invalid Voucher Code! Try SMART50.');
    }
  }

  handleOrderFlow() {
    if (!this.showPaymentOptions) {
      this.showPaymentOptions = true; 
    } else {
      
      if (!this.selectedAddressId) {
        alert("❌ దయచేసి డెలివరీ అడ్రస్ సెలెక్ట్ చేసుకోండి బ్రదర్!");
        return;
      }

      if (this.paymentMode === 'WALLET') {
        if (this.walletBalance < this.grandTotal) {
          alert(`❌ Wallet Balance is Low! మీ గ్రాండ్ టోటల్ ₹${this.grandTotal} కానీ వాలెట్ లో ₹${this.walletBalance} మాత్రమే ఉన్నాయి బ్రదర్.`);
          return; 
        }
      }

      // 📦 🎯 🌟 ఇగో బ్రదర్! ఇక్కడ 'paymentMode' ని పక్కాగా మ్యాప్ చేసి పంపుతున్నాం!
      const orderData = {
        customerId: this.loggedInUserId, 
        totalAmount: this.grandTotal,
        addressId: this.selectedAddressId, 
        paymentMode: this.paymentMode, // 👈 🎯 ఇందాక నువ్వు పంపిన కోడ్ లో ఈ లైన్ మిస్ అయింది బ్రదర్!
        items: this.cartItems.map(item => ({
          productId: item.productId || item.id || 1, 
          quantity: item.selectedQty,
          price: item.price
        }))
      };

      this.http.post(`${environment.apiUrl}/api/orders/place`, orderData, { responseType: 'text' })
        .subscribe({
          next: (response) => {
            alert(`🎉 ${response}`); 
            
            this.cartItems.forEach(item => item.selectedQty = 0);
            localStorage.removeItem(`userCart_${this.loggedInUserId}`); 
            
            if (this.paymentMode === 'WALLET') {
              const deductUrl = `${environment.apiUrl}/api/users/wallet/add?userId=${this.loggedInUserId}&amount=-${this.grandTotal}`;
              this.http.put(deductUrl, {}, { responseType: 'text' }).subscribe();
            }

            if (this.cartService.clearCart) {
              this.cartService.clearCart();
            }
            this.router.navigate(['/home']); 
          },
          error: (err) => {
            console.error(err);
            alert('❌ Failed to place order. Out of stock or Server Error!');
          }
        });
    }
  }

  goBackToHome() {
    this.router.navigate(['/home']);
  }
  increaseQuantity(item: any) {
  item.selectedQty++;
  this.updateCartInStorage(); // ఇది పర్మినెంట్ గా అప్‌డేట్ అవ్వడానికి
}

decreaseQuantity(item: any) {
  if (item.selectedQty > 1) {
    item.selectedQty--;
  } else {
    // ఒకవేళ 1 కంటే తగ్గితే, ఆ ఐటమ్ ని కార్ట్ నుండి తీసేయాలి
    this.cartItems = this.cartItems.filter(i => i.id !== item.id);
  }
  this.updateCartInStorage();
}

updateCartInStorage() {
  // ఇక్కడ నువ్వు LocalStorage లేదా Database లో మళ్ళీ సేవ్ చేసుకుంటావు
  localStorage.setItem('cart', JSON.stringify(this.cartItems));
}
}