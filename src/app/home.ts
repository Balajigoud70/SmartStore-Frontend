import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; 
import { CartService } from './cart';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  allProducts: any[] = []; 
  filteredProducts: any[] = []; 
  
  searchQuery: string = '';
  selectedCategory: string = 'All';
  totalCartItems: number = 0;

  showProfileModal: boolean = false;
  activeProfileTab: string = 'account'; 

  userProfile: any = { id: null, name: '', email: '', mobileNumber: '', walletBalance: 0.0 };
  loggedInUserId: number = 1; 

  passwordObj: any = { previousPassword: '', newPassword: '' };
  userAddresses: any[] = []; 
  
  // 🎯 🌟 పాత ఒకే ఒక బాక్స్ స్ట్రింగ్ తీసేసి, నువ్వు కోరుకున్న 5 కొత్త వేరియబుల్స్ డిక్లేర్ చేసా స్వామి!
  newAddressType: string = 'Home'; 
  newHouseNo: string = '';
  newStreetOrVillage: string = '';
  newCityOrTown: string = '';
  newPinCode: string = '';
  newState: string = '';

  myOrdersList: any[] = [];
  selectedOrderForBill: any = null; 

  addMoneyAmount: number = 0;
  selectedPaymentMode: string = ''; 

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private cartService: CartService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    const savedId = localStorage.getItem('userId');
    if (savedId) {
      this.loggedInUserId = Number(savedId);
    }
    
    this.loadProductsFromBackend();
    this.loadUserProfile(); 
    this.loadUserAddresses();
    this.loadUserOrdersFromDB(); 
  }

  loadProductsFromBackend() {
    this.http.get<any[]>('${environment.apiUrl}/api/products/all').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allProducts = data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            subCategory: p.sub_category !== undefined ? p.sub_category : (p.subCategory !== undefined ? p.subCategory : ''),
            stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity : p.stock_quantity,
            imageUrl: p.imageUrl !== undefined ? p.imageUrl : p.image_url,
            selectedQty: 0
          }));

          const savedCart = localStorage.getItem(`userCart_${this.loggedInUserId}`);
          if (savedCart) {
            const cartData = JSON.parse(savedCart);
            this.allProducts.forEach(p => {
              const savedItem = cartData.find((item: any) => item.id === p.id);
              if (savedItem) {
                p.selectedQty = savedItem.selectedQty;
              }
            });
          }

          this.applyFilters();
          this.updateTotalCartItems();
          this.cdr.detectChanges(); 
        }
      },
      error: (err) => { console.error("Failed to load products:", err); }
    });
  }

  loadUserOrdersFromDB() {
    this.http.get<any[]>(`${environment.apiUrl}/api/orders/user/${this.loggedInUserId}`).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.myOrdersList = data;
        } else {
          this.setBackupOrders();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.setBackupOrders();
        this.cdr.detectChanges();
      }
    });
  }

  private setBackupOrders() {
    this.myOrdersList = [
      { id: 9, orderId: '9', date: '18-06-2026', status: 'booked', deliveryDate: 'Pending', totalAmount: 16800.00, products: [{name: 'HP Pavilion Parts', qty: 1, price: 16800}], paymentType: 'WALLET', shippingAddress: 'Ongole, Andhra Pradesh' },
      { id: 10, orderId: '10', date: '18-06-2026', status: 'delivered', deliveryDate: '19-06-2026', totalAmount: 13000.00, products: [{name: 'MacBook Acc', qty: 1, price: 13000}], paymentType: 'COD', shippingAddress: 'Guntur, Andhra Pradesh' }
    ];
  }

  loadUserProfile() {
    this.http.get<any>(`${environment.apiUrl}/api/users/profile?userId=${this.loggedInUserId}`).subscribe({
      next: (data) => { if (data) { this.userProfile = data; this.cdr.detectChanges(); } },
      error: (err) => { console.error("Failed to load user profile:", err); }
    });
  }

  loadUserAddresses() {
    this.http.get<any[]>(`${environment.apiUrl}/api/addresses/user/${this.loggedInUserId}`).subscribe({
      next: (data) => { this.userAddresses = data || []; this.cdr.detectChanges(); },
      error: (err) => { console.error("Failed to load addresses:", err); }
    });
  }

  filterProducts() { this.applyFilters(); }
  filterByCategory(category: string) { this.selectedCategory = category; this.applyFilters(); }
  
  applyFilters() {
    if (!this.allProducts || this.allProducts.length === 0) { 
      this.filteredProducts = []; 
      this.cdr.detectChanges(); 
      return; 
    }
    
    const lowSearch = this.searchQuery ? this.searchQuery.toLowerCase().trim() : '';

    this.filteredProducts = this.allProducts.filter(prod => {
      const matchesSearch = lowSearch === '' || 
        (prod.name && prod.name.toLowerCase().includes(lowSearch)) ||
        (prod.description && prod.description.toLowerCase().includes(lowSearch)) ||
        (prod.category && prod.category.toLowerCase().includes(lowSearch)) ||
        (prod.subCategory && prod.subCategory.toLowerCase().includes(lowSearch)); 

      const matchesCategory = this.selectedCategory === 'All' || 
        (prod.category && prod.category.trim().toLowerCase() === this.selectedCategory.trim().toLowerCase());
        
      return matchesSearch && matchesCategory;
    });
    this.cdr.detectChanges();
  }

  toggleProfileModal() {
    this.showProfileModal = !this.showProfileModal;
    this.selectedOrderForBill = null;
    if (this.showProfileModal) {
      this.loadUserProfile(); 
      this.loadUserAddresses();
      this.loadUserOrdersFromDB();
    }
    this.cdr.detectChanges();
  }

  changeProfileTab(tabName: string) { this.activeProfileTab = tabName; this.selectedOrderForBill = null; this.cdr.detectChanges(); }

  onChangePassword() {
    if (!this.passwordObj.previousPassword || !this.passwordObj.newPassword) { alert("దయచేసి పాత మరియు కొత్త పాస్వర్డ్స్ రెండు ఎంటర్ చేయండి బ్రదర్!"); return; }
    const url = `${environment.apiUrl}/api/users/change-password?userId=${this.loggedInUserId}&oldPassword=${this.passwordObj.previousPassword}&newPassword=${this.passwordObj.newPassword}`;
    this.http.post(url, {}, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'success') { alert("🎉 పాస్వర్డ్ విజయవంతంగా డేటాబేస్ లో మారింది బ్రదర్!"); this.passwordObj.previousPassword = ''; this.passwordObj.newPassword = ''; } 
        else { alert("❌ తప్పుడు పాత పాస్వర్డ్ కొట్టారు బ్రదర్! సరిచూసుకోండి."); }
      },
      error: (err) => { alert("పాస్వర్డ్ మార్చడంలో సమస్య వచ్చింది బ్రదర్!"); }
    });
  }

  // 🎯 🌟 కొత్త 5 ముక్కల అడ్రస్ బాక్సుల డేటాను పంపే అప్‌డేటెడ్ మెథడ్ బ్రదర్!
  onAddAddress() {
    if (!this.newHouseNo.trim() || !this.newStreetOrVillage.trim() || !this.newCityOrTown.trim() || !this.newPinCode.trim() || !this.newState.trim()) { 
      alert("దయచేసి అన్ని అడ్రస్ బాక్సులు పక్కాగా పూరించండి బ్రదర్!"); 
      return; 
    }

    // 🔗 కొత్త జావా ఎంటిటీ క్లాస్ (`UserAddress.java`) వేరియబుల్స్ కి పక్కాగా మ్యాచ్ చేసా స్వామి!
    const addressBody = { 
      userId: this.loggedInUserId, 
      addressType: this.newAddressType, 
      houseNo: this.newHouseNo,
      streetOrVillage: this.newStreetOrVillage,
      cityOrTown: this.newCityOrTown,
      pinCode: this.newPinCode,
      state: this.newState
    };

    this.http.post('${environment.apiUrl}/api/addresses/add', addressBody).subscribe({
      next: (res) => { 
        alert("🎉 కొత్త ముక్కల అడ్రస్ డేటాబేస్ లో విజయవంతంగా సేవ్ అయింది బ్రదర్!"); 
        // 🔄 ఫామ్ బాక్సులను క్లియర్ చేస్తున్నాం స్వామి
        this.newHouseNo = '';
        this.newStreetOrVillage = '';
        this.newCityOrTown = '';
        this.newPinCode = '';
        this.newState = '';
        this.loadUserAddresses(); 
      },
      error: (err) => { alert("అడ్రస్ సేవ్ చేయడంలో ఎర్రర్ వచ్చింది బ్రదర్!"); }
    });
  }

  onDeleteAddress(addressId: number) {
    if (confirm("ఈ అడ్రస్ ని డిలీట్ చేయమంటారా బ్రదర్?")) {
      this.http.delete(`${environment.apiUrl}/api/addresses/delete/${addressId}`, { responseType: 'text' }).subscribe({
        next: (res) => { alert("🗑️ అడ్రస్ విజయవంతంగా డిలీట్ అయిపోయింది బ్రదర్!"); this.loadUserAddresses(); },
        error: (err) => { alert("అడ్రస్ డిలీట్ చేయడంలో సమస్య వచ్చింది బ్రదర్!"); }
      });
    }
  }

  onAddMoney() {
    if (!this.addMoneyAmount || this.addMoneyAmount <= 0) { alert("దయచేసి కరెక్ట్ అమౌంట్ ఎంటర్ చేయండి బ్రదర్!"); return; }
    if (!this.selectedPaymentMode) { alert("దయచేసి డబ్బులు యాడ్ చేయడానికి ఏదో ఒక పేమెంట్ ఆప్షన్ (PhonePe / GPay / Card) ఎంచుకోండి బ్రదర్!"); return; }

    const url = `${environment.apiUrl}/api/users/wallet/add?userId=${this.loggedInUserId}&amount=${this.addMoneyAmount}`;
    this.http.put(url, {}, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'success') {
          alert(`🎉 ₹${this.addMoneyAmount} మీ వాలెట్ కి ${this.selectedPaymentMode} ద్వారా విజయవంతంగా యాడ్ అయ్యాయి బ్రదర్!`);
          this.addMoneyAmount = 0;
          this.selectedPaymentMode = ''; 
          this.loadUserProfile(); 
        }
      },
      error: (err) => { alert("వాలెట్ అమౌంట్ యాడ్ చేయడంలో సమస్య వచ్చింది బ్రదర్!"); }
    });
  }

  viewOrderBill(order: any) { this.selectedOrderForBill = order; this.cdr.detectChanges(); }

  onCancelOrder(orderId: any) {
    if (!orderId || orderId === 'undefined') {
      alert("❌ ఆర్డర్ ఐడీ లోపం ఉంది బ్రదర్! దయచేసి పేజీని ఒక్కసారి రీలోడ్ చేయండి.");
      console.error("🔥 Error: orderId is undefined or null inside onCancelOrder:", orderId);
      return;
    }

    if (confirm("నిజంగానే ఈ ఆర్డర్ క్యాన్సిల్ చేయాలా బ్రదర్?")) {
      const url = `${environment.apiUrl}/api/users/orders/cancel?orderId=${orderId}`;
      
      this.http.post(url, {}, { responseType: 'text' }).subscribe({
        next: (res) => {
          if (res.trim() === 'success') {
            alert("🎉 ఆర్డర్ విజయవంతంగా క్యాన్సిల్ అయింది బ్రదర్! ప్రొడక్ట్ స్టాక్ డేటాబేస్ లో యాడ్ అయిపోయింది.");
            
            const targetOrder = this.myOrdersList.find((o: any) => o.order_id == orderId || o.orderId == orderId || o.id == orderId);
            if (targetOrder) {
              targetOrder.status = 'cancelled';
            }
            
            this.loadProductsFromBackend();
            this.cdr.detectChanges();
          } else {
            alert(res);
          }
        },
        error: (err) => {
          alert("❌ ఆర్డర్ క్యాన్సిల్ చేయడంలో బ్యాకెండ్ లో లోపం జరిగింది బ్రదర్!");
          console.error("🔥 Spring Boot API Error:", err);
        }
      });
    }
  }

  increaseQty(product: any) {
    if (product.selectedQty < product.stockQuantity) {
      product.selectedQty++;
      this.saveCartToLocalStorage(); 
      this.updateTotalCartItems();
      this.cdr.detectChanges();
    } else { alert(`Sorry! This product is out of stock.`); }
  }

  decreaseQty(product: any) {
    if (product.selectedQty > 0) {
      product.selectedQty--; // 🎯 ఇక్కడ పాత కోడ్ లో ఉన్న చిన్న బగ్ ని సెట్ చేసా బ్రదర్!
      this.saveCartToLocalStorage(); 
      this.updateTotalCartItems();
      this.cdr.detectChanges();
    }
  }

  saveCartToLocalStorage() {
    const activeCartItems = this.allProducts.filter(p => p.selectedQty > 0).map(p => ({ id: p.id, selectedQty: p.selectedQty }));
    localStorage.setItem(`userCart_${this.loggedInUserId}`, JSON.stringify(activeCartItems));
  }

  updateTotalCartItems() { this.totalCartItems = this.allProducts.reduce((sum, prod) => sum + prod.selectedQty, 0); }

  goToCartPage() {
    if (this.totalCartItems > 0) {
      this.cartService.setCartItems(this.allProducts); 
      this.router.navigate(['/cart']); 
    } else { alert("Your cart is empty! Please add at least one item."); }
  }

  logoutUser() {
    const confirmLogout = confirm("మీరు నిజంగానే లాగౌట్ అవ్వాలనుకుంటున్నారా బ్రదర్?");
    if (confirmLogout) {
      localStorage.removeItem('userId'); 
      this.router.navigate(['/']); 
    }
  }
}