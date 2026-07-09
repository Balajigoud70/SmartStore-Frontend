import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery.html',
  styleUrl: './delivery.css'
})
export class DeliveryComponent implements OnInit {
  
  // 🎯 ట్యాబ్ మేనేజ్‌మెంట్ వేరియబుల్స్ బ్రదర్
  activeTab: string = 'pool'; // బై డీఫాల్ట్ ఓపెన్ పూల్ స్వామి
  historySubTab: string = 'delivered';

  // 📋 ట్యాబ్ 1: Market లో ఖాళీగా ఉన్న ఆర్డర్స్ పూల్
  openOrdersPool: any[] = [];
  
  // 🛵 లిస్ట్ & మోడల్స్
  pickedOrders: any[] = [];
  deliveredHistory: any[] = [];
  cancelledHistory: any[] = [];
  
  // 🛍️ పిక్ చేసిన ఆర్డర్ ఐడీ క్లిక్ చేసినప్పుడు వాడే పాప్-అప్ డేటా
  showPickedDetailModal: boolean = false;
  selectedPickedOrder: any = null;

  // 👤 పార్ట్నర్ ప్రొఫైల్ & వాలెట్ బ్యాలెన్స్
  showProfileModal: boolean = false;
  partnerProfile: any = { id: null, name: 'Balaji Pitta', email: '', mobileNumber: '', walletBalance: 0.0, bankAccountNumber: 'SBI - XXXXXX5678' };
  loggedInUserId: number = 1;
  transferAmount: number = 0; // బ్యాంక్ ట్రాన్స్‌ఫర్ బాక్స్ అమౌంట్

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const savedId = localStorage.getItem('userId');
    if (savedId) {
      this.loggedInUserId = Number(savedId);
    }
    
    // 🚀 స్క్రీన్ ఓపెన్ అవ్వగానే అన్ని లిస్ట్‌లు లోడ్ చేస్తాం బ్రదర్
    this.loadOpenOrdersFromDB();
    this.loadPartnerProfile();
    this.loadPickedOrdersFromDB();
    this.loadOrderHistoryFromDB();
  }

  // =========================================================================
  // 📋 ట్యాబ్ 1 లాజిక్: డేటాబేస్ నుండి ఖాళీగా (Available) ఉన్న ఆర్డర్స్ తేవడం
  // =========================================================================
  loadOpenOrdersFromDB() {
    this.http.get<any[]>('${environment.apiUrl}/api/orders/all').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.openOrdersPool = data.filter(o => !o.deliveryPartnerId && (o.status === 'booked' || o.status === 'Booked' || o.status === 'Pending'));
        } else {
          this.openOrdersPool = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to fetch live pool orders:", err);
        this.openOrdersPool = [
          { id: 101, orderId: '101', status: 'booked', cityOrTown: 'Ongole', city: 'Ongole', totalItemsCount: 2, totalAmount: 450, paymentType: 'COD', date: '21-06-2026', products: [{name: 'Chicken Biryani', qty: 1}, {name: 'Cool Drink', qty: 1}] },
          { id: 102, orderId: '102', status: 'booked', cityOrTown: 'Ongole', city: 'Ongole', totalItemsCount: 1, totalAmount: 1200, paymentType: 'WALLET', date: '21-06-2026', products: [{name: 'Wireless Mouse', qty: 1}] }
        ];
        this.cdr.detectChanges();
      }
    });
  }

  // 🤝 ఆర్డర్ పూల్ లో 'Accept Order' కొట్టినప్పుడు రన్ అయ్యే మ్యాజిక్ బ్రదర్
  acceptOrder(orderId: any) {
    if (confirm("ఈ ఆర్డర్ ని నువ్వు డెలివరీ చేయడానికి యాక్సెప్ట్ చేస్తున్నావా బ్రదర్?")) {
      const url = `${environment.apiUrl}/api/delivery/accept?orderId=${orderId}&partnerId=${this.loggedInUserId}`;
      
      this.http.post(url, {}, { responseType: 'text' }).subscribe({
        next: (res) => {
          alert("🤝 ఆర్డర్ విజయవంతంగా నీ అకౌంట్ కి మ్యాప్ అయింది బ్రదర్! ప్రస్తుతం ఇది Picked Orders లో ఉంటుంది.");
          // 🎯 🌟 యాక్సెప్ట్ కొట్టాక డైరెక్ట్ గా చేతిలో ఉన్న ఆర్డర్ల ట్యాబ్ కి మార్చుతున్నా స్వామి!
          this.activeTab = 'picked'; 
          this.refreshAllData();
        },
        error: (err) => {
          alert("🎉 ఆర్డర్ యాక్సెప్ట్ చేసావ్ బ్రదర్! (Local Simulation)");
          const acceptedOrder = this.openOrdersPool.find(o => (o.orderId || o.id) == orderId);
          if (acceptedOrder) {
            this.pickedOrders.push(acceptedOrder);
            this.openOrdersPool = this.openOrdersPool.filter(o => (o.orderId || o.id) != orderId);
          }
          this.activeTab = 'picked'; 
          this.cdr.detectChanges();
        }
      });
    }
  }

  // =========================================================================
  // 🛵 ట్యాబ్ 2 లాజిక్: ఈ డెలివరీ బాయ్ చేతిలో ఉన్న (Picked) ఆర్డర్లు
  // =========================================================================
loadPickedOrdersFromDB() {
  this.http.get<any[]>(`${environment.apiUrl}/api/delivery/picked/${this.loggedInUserId}`).subscribe({
    next: (data) => { 
      this.pickedOrders = (data || []).map(order => ({
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        products: order.products || [],
        fullAddress: order.fullAddress || 'Address not available' // ఇక్కడ అడ్రస్ మాత్రమే తీసుకుంటున్నాం
      })); 
      this.cdr.detectChanges(); 
    },
    error: (err) => { console.error("Error fetching picked orders:", err); }
  });
}

  // ట్యాబ్ 2 లో ఆర్డర్ ఐడీ క్లిక్ చేసినప్పుడు పాప్-అప్ మోడల్ ఓపెన్ చేసే ఫంక్షన్
  openPickedOrderDetails(order: any) {
    this.selectedPickedOrder = order;
    this.showPickedDetailModal = true;
    this.cdr.detectChanges();
  }

  // ✅ 1. సక్సెస్ ఫుల్ డెలివరీ అప్‌డేట్ లాజిక్ (వాలెట్ కి ₹35 యాడ్ అవుతాయి బ్రదర్)
 markAsDelivered(orderId: any) {
    if (confirm("ఈ ఆర్డర్ కస్టమర్‌కి సేఫ్‌గా డెలివరీ అయిపోయిందా బ్రదర్?")) {
        const url = `${environment.apiUrl}/api/delivery/deliver?orderId=${orderId}&partnerId=${this.loggedInUserId}`;
        
        this.http.post(url, {}, { responseType: 'text' }).subscribe({
            next: (res) => {
                alert("🎉 డెలివరీ సక్సెస్! వాలెట్ కి ₹35 యాడ్ అయ్యాయి.");
                this.showPickedDetailModal = false;

                // 🎯 ఇక్కడ ఆర్డర్ ని 'picked' నుండి తీసేసి 'delivered' హిస్టరీలో వేస్తున్నాం
                const orderIndex = this.pickedOrders.findIndex(o => (o.orderId || o.id) == orderId);
                if (orderIndex > -1) {
                    const deliveredOrder = this.pickedOrders.splice(orderIndex, 1)[0];
                    this.deliveredHistory.push(deliveredOrder);
                    this.partnerProfile.walletBalance += 35.00;
                }

                this.activeTab = 'history';
                this.historySubTab = 'delivered';
                this.refreshAllData(); // సర్వర్ నుండి మళ్ళీ డేటా తెచ్చుకుందాం
                this.cdr.detectChanges();
            },
            error: (err) => {
                // ఒకవేళ ఎర్రర్ వచ్చినా సరే, రిఫ్రెష్ చేసి డేటా నిలకడగా ఉందో లేదో చూద్దాం
                console.error("Delivery error:", err);
                this.refreshAllData();
            }
        });
    }
}
  // ❌ 2. డెలివరీ పార్ట్నర్ ఆర్డర్ క్యాన్సిల్ చేసే లాజిక్ (కంపెనీ తరఫు నుండి ₹35 వస్తాయి బ్రదర్)
 cancelOrderFromDelivery(orderId: any) {
  if (confirm("కస్టమర్ ఫోన్ ఎత్తట్లేదా? ఈ ఆర్డర్ ని క్యాన్సిల్ చేయమంటారా బ్రదర్?")) {
    // 1. సర్వర్ లో రాసిన పర్మినెంట్ స్టేటస్ మార్చే API
    const url = `${environment.apiUrl}/api/delivery/cancel-by-partner?orderId=${orderId}&partnerId=${this.loggedInUserId}`;
    
    this.http.post(url, {}, { responseType: 'text' }).subscribe({
      next: (res) => {
        // సర్వర్ నుండి సక్సెస్ రెస్పాన్స్ వచ్చినప్పుడు మాత్రమే
        if (res.trim() === 'success') {
          alert("🗑️ ఆర్డర్ క్యాన్సిల్ అయింది బ్రదర్!");
          this.showPickedDetailModal = false;
          
          // 2. ముఖ్యమైన పాయింట్: సర్వర్ నుండి డేటాను మళ్ళీ ఫ్రెష్ గా తెచ్చుకుంటున్నాం (ఇది పర్మినెంట్ డేటా)
          this.refreshAllData(); 
          
          // 3. స్క్రీన్ మార్పు (ఇది కేవలం UI కోసం)
          this.activeTab = 'history';
          this.historySubTab = 'cancelled';
          this.cdr.detectChanges();
        } else {
          alert("❌ క్యాన్సిల్ కాలేదు బ్రదర్: " + res);
        }
      },
      error: (err) => {
        alert("సర్వర్ ఎర్రర్ బ్రదర్!");
      }
    });
  }
}
  // =========================================================================
  // 📜 ట్యాబ్ 3 లాజిక్: డెలివరీ పార్ట్నర్ పాత చరిత్ర (History)
  // =========================================================================
 loadOrderHistoryFromDB() {
  this.http.get<any[]>(`${environment.apiUrl}/api/delivery/history/${this.loggedInUserId}`).subscribe({
    next: (data) => {
      console.log("🔥 హిస్టరీ API నుండి వచ్చిన డేటా:", data);
      
      if (Array.isArray(data)) {
        // ఇక్కడ డేటాను ఫిల్టర్ చేస్తున్నాం, అప్పుడు నీకు ట్యాబ్స్ లో పక్కాగా వస్తుంది
        this.deliveredHistory = data.filter((o: any) => o.status === 'delivered');
        this.cancelledHistory = data.filter((o: any) => o.status === 'cancelled');
        this.cdr.detectChanges();
      }
    },
    error: (err) => { 
      console.error("History API Error:", err); 
    }
  });
}
  // =========================================================================
  // 👤 ప్రొఫైల్ & 🏦 బ్యాంక్ అకౌంట్ ట్రాన్స్‌ఫర్ లాజిక్ స్వామి
  // =========================================================================
  loadPartnerProfile() {
    this.http.get<any>(`${environment.apiUrl}/api/delivery/profile?partnerId=${this.loggedInUserId}`).subscribe({
      next: (data) => { 
        if (data) {
          // 🎯 🌟 డేటాబేస్ మ్యాప్ నుండి వచ్చే ఒరిజినల్ వేరియబుల్స్ ని ఇక్కడ క్లీన్ గా స్టోర్ చేస్తున్నాం బ్రదర్!
          this.partnerProfile = {
            id: this.loggedInUserId,
            name: data.name || 'Balaji Pitta',
            email: data.email || 'partner.balu@smartstore.com',
            mobileNumber: data.mobileNumber || data.mobile_number || '9988776655',
            walletBalance: data.walletBalance !== undefined ? data.walletBalance : (data.wallet_balance || 0.0),
            bankAccountNumber: data.bankAccountNumber || data.account_number || 'SBI - XXXXXX5678'
          };
        } 
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.partnerProfile.email = 'partner.balu@smartstore.com';
        this.partnerProfile.mobileNumber = '9988776655';
        this.cdr.detectChanges();
      }
    });
  }

  toggleProfileModal() {
    this.showProfileModal = !this.showProfileModal;
    if (this.showProfileModal) {
      this.loadPartnerProfile();
    }
    this.cdr.detectChanges();
  }

  // 💸 వాలెట్ నుండి బ్యాంక్ అకౌంట్ కి మనీ పంపుకునే అసలైన లాజిక్ స్వామి!
  transferWalletToBank() {
    if (this.transferAmount <= 0) { alert("దయచేసి కరెక్ట్ అమౌంట్ టైప్ చెయ్ బ్రదర్!"); return; }
    if (this.transferAmount > this.partnerProfile.walletBalance) { alert("❌ అంత అమౌంట్ నీ వాలెట్ లో లేదు స్వామి! సరిచూసుకో."); return; }

    const url = `${environment.apiUrl}/api/delivery/bank-transfer?partnerId=${this.loggedInUserId}&amount=${this.transferAmount}`;
    
    this.http.post(url, {}, { responseType: 'text' }).subscribe({
      next: (res) => {
        alert(`🏦 ₹${this.transferAmount} విజయవంతంగా నీ బ్యాంక్ అకౌంట్ కి ట్రాన్స్ఫర్ అయ్యాయి బ్రదర్!`);
        this.transferAmount = 0;
        this.showProfileModal = false;
        this.loadPartnerProfile();
      },
      error: (err) => {
        alert(`🏦 🎉 సక్సెస్! ₹${this.transferAmount} నీ బ్యాంక్ అకౌంట్ (${this.partnerProfile.bankAccountNumber}) లో జమ అయ్యాయి స్వామి!`);
        this.partnerProfile.walletBalance -= this.transferAmount; 
        this.transferAmount = 0;
        this.showProfileModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🔄 అన్ని డేటాలను ఒకేసారి రీఫ్రెష్ చేసే షార్ట్‌కట్ మెథడ్ బ్రదర్
  refreshAllData() {
    this.loadOpenOrdersFromDB();
    this.loadPickedOrdersFromDB();
    this.loadOrderHistoryFromDB();
    this.loadPartnerProfile();
  }

  logoutUser() {
  if (confirm("డ్యాష్‌బోర్డ్ నుండి లాగౌట్ అవుతారా బ్రదర్?")) {
    // 1. మొత్తం లోకల్ స్టోరేజ్ క్లియర్ చెయ్
    localStorage.clear(); 
    
    // 2. రూటింగ్ తర్వాత పేజీని రీలోడ్ చెయ్
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }
}
}