import { LightningElement,track,wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import salesarea from '@salesforce/apex/AccountLedgerReport.getsalesarea';
import accountnames from '@salesforce/apex/AccountLedgerReport.getaccounts';
import ledgertable from '@salesforce/apex/AccountLedgerReport.getcustomerdetails';
import osbalance from '@salesforce/apex/AccountLedgerReport.getOsBalance';

export default class PracticeLwc extends LightningElement {

   @track ledgerColumn = [
        {label: 'Document No', fieldName: 'DocumentNo',wrapText:true,initialWidth: 250},
        {label: 'Transaction Date', fieldName: 'Dates',wrapText:true,initialWidth: 190},
        {label: 'Document Text', fieldName: 'Narration',wrapText:true,initialWidth: 390},
        {label: 'Debit', fieldName: 'Debit' ,type:'currency',wrapText:true,initialWidth:170,
        cellAttributes:{ ¬¬
            class:{fieldName:'Amountcolors'},
            iconName:{fieldName:'iconnames'},
            iconPosition: 'right',
        }
    },
        {label: 'Credit', fieldName: 'Credit',type:'currency',wrapText:true,initialWidth:170,
        cellAttributes:{
            class:{fieldName:'Amountcolor'},
            iconName:{fieldName:'iconname'},
            iconPosition: 'right',
            iconClass:'red-utility-icon',
        }},

        //{label: 'Amount', fieldName:'Amount'},
        {label: 'Balance', fieldName:'balance',type:'currency',wrapText:true,initialWidth:170}
    ]

    @track data=[];
    @track data2=[];
    @track data3=[];
    @track data4 =[];
    @track data5 = [];
    @track finaldata = [];
    @track Mergearray=[];
    @track selectarea;
    @track billcustomer;
    @track fdate;
    @track edate;
    @track previousbalance = 0;
    @track size = 0;
    @track datafound = false;
    @track loaded = false;
    @track error;
    @track errors = false;
    @track customername = '';

     @track isMobileLayout = false;

    connectedCallback() {
        this.checkDeviceLayout();
        window.addEventListener('resize', this.checkDeviceLayout);
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.checkDeviceLayout);
    }

  
    checkDeviceLayout() {
      this.isMobileLayout = window.innerWidth <= 600; // Set the mobile breakpoint as per your requirements
      console.log('size'+window.innerWidth)
    }

    @wire(salesarea)
    area({data,error}){
        if(data){
            console.log('data'+data);
            this.data = data;
            this.data = this.data.map(value => ({label : value , value : value}));
            console.log('data'+JSON.stringify(this.data));
        }
        if(error){
            this.errors = true;
            this.error = error.body.message;
            console.log('error'+JSON.stringify(error));

        }
        
    }
   /* @wire(accountnames)
    names({data,error}){
        if(data){
            console.log('data2'+JSON.stringify(data));
        }
        if(error){
            console.log('error'+JSON.stringify(error))
        }
    }*/
        
    

    handlesalesChange(event){
        this.loaded = true;
        this.selectarea = event.detail.value;
        console.log('selectdata', this.selectarea);
        this.data2 = null;
        this.datafound = false;
        this.billcustomer = null;
        accountnames({ selectareas: this.selectarea})
        .then(result => {
            console.log('result' + result)
            console.log('hello');
             this.data2 = result;
            if(this.data2 == '' || this.data2 == null){
                this.loaded = false;
                this.errors = true;
                this.error = 'No customers available in this salesarea';
            }else{
            
            this.data2= result.map( value=> ({ label: value.Name+'-'+value.AccountNumber , value: value.SAP_Code__c }));
            this.loaded = false;
            this.size = this.data.length;
            console.log('data2'+JSON.stringify(this.data2));
            this.errors = false;
            }
        })
        .catch(error => {
            this.errors = true;
            this.error = error.body.message;
        })
        }   

    handlebillchange(event){
        this.datafound = false;
        this.billcustomer = event.detail.value;
        this.customername = this.data2.find(option => option.value === this.billcustomer).label;
        console.log('Customer Name'+this.customername);
        console.log('billcustomer==>'+ this.billcustomer);
    }
    handleFdateChange(event){
        this.fdate = event.detail.value;
        console.log('Fromdate==>'+this.fdate);
    }
    handleEdateChange(event){
        this.edate = event.detail.value;
        console.log('EndDate==>'+this.edate);
    }
    osbalance(){
        osbalance({ sapcode: this.billcustomer,fromdate: this.fdate, todate : this.edate})
        .then(result => {
            this.data4 = result;
            if(this.data4.length > 0){
                this.data4 = this.data4.map(row =>{
                    return{...row,Credit:'',Debit:'',DocumentNo:''}
                })
                console.log('osdata'+JSON.stringify(this.data4));
            this.data4.forEach(value =>{
                this.previousbalance = Math.round(value.balance);
                console.log('step678A======>'+this.previousbalance);
            });
            this.data3.forEach(value =>{
                if(value.ModeofTransactions == 'Debit'){
                    console.log('step2222======>'+value.Amount);
                  this.previousbalance = this.previousbalance + value.Amount;
                   console.log('step0000======>'+JSON.stringify(this.previousbalance));
                   value.balance = this.previousbalance;
                }
                if(value.ModeofTransactions == 'Credit'){
                    this.previousbalance = this.previousbalance - value.Amount;
                    value.balance = this.previousbalance;
                  }
            })
            console.log('step1======>'+JSON.stringify(this.data3));
            console.log('previousbalance'+this.previousbalance);
            console.log('data4'+JSON.stringify(this.data4));
            this.data5 = [];
            /*this.data4 = this.data4.map(row => {
                return{...row,balance:row.Opening_Balance__c,Narration:'Opening Balance'}
            });*/
            const obj = {Narration:'Closing Balance',balance:this.previousbalance,Dates:'',Credit:'',Debit:'',DocumentNo:''};
            //if(this.data5 == ''){
                this.data5.push(obj);
                console.log('Data5'+JSON.stringify(this.data5));
            //}
            
            this.finaldata = [...this.data4,...this.data3,...this.data5];
            console.log('Mergearray'+JSON.stringify(this.Mergearray));
            this.datafound = true;
        }
            this.loaded = false;
            this.errors = false;
        
        })
        .catch(error =>{
            this.errors = true;
            this.error = error.body.message;
            this.loaded = false;
        })
    }

    submit(){
        console.log('Selectarea==>'+this.selectarea);
        console.log('bill Customer==>'+this.billcustomer);
        console.log('From date==>'+this.fdate);
        console.log('End Date==>'+this.edate);
       // this.selectarea = event.detail.value;
       // console.log('selectdata', this.selectarea);
       if(this.selectarea == null || this.billcustomer == null || this.fdate == null ||this.edate ==null){
        this.errors = true;
        this.error = 'Please select the required field';
        
       }else{
       this.loaded = true;
       
        
       ledgertable({ sapcode: this.billcustomer,fromdate: this.fdate, todate : this.edate})
        .then(result => {
            console.log('result' + result)
            console.log('hello');
            this.data3 = result;
            
            this.data3 = this.data3.map(row => {
                return{...row,Debit:row.ModeofTransactions =='Debit'?row.Amount:'',Credit:row.ModeofTransactions=='Credit'?row.Amount:'',
                Amountcolor : row.ModeofTransactions =='Credit'?'slds-text-color_success':'',
                Amountcolors : row.ModeofTransactions =='Debit'?'slds-text-color_destructive':'',
                iconname:row.ModeofTransactions =='Credit'?'utility:up':'',
                iconnames:row.ModeofTransactions =='Debit'?'utility:down':'',
            }
            })
            console.log('data3'+JSON.stringify(this.data3));
        })
        .catch(error => {
            this.errors = true;
            this.error = error.body.message;
            
        })
        this.osbalance();
    }
    }
    exportToExcel(){
        // Prepare a html table
        console.log('Download======'+JSON.stringify(this.data3));
        let doc = '<table>';
        // Add styles for the table
        doc += '<style>';
        doc += 'table, th, td {';
        doc += '    border: 1px solid black;';
        doc += '    border-collapse: collapse;';
        doc += '}';          
        doc += '</style>';
        // Add all the Table Headers
        doc += '<h1 style="text-align: center;color: rgb(54, 104, 243);" >'+'Ledger Details'+'</h1>';
        doc += '<h3 style="text-align: center;color: rgb(184, 38, 118);" >'+'Customer Name : '+this.customername+'</h3>';
        doc += '<tr>';
        doc += '<th>'+ 'Period' +'</th>';
        doc += '<th>'+ 'From Date : '+this.fdate +'</th>';
        doc += '<th>'+ 'To Date : '+this.edate +'</th>';
        doc += '</tr>';
        doc += '<tr>';
                   
            doc += '<th style="background-color: #87cefa;">'+ 'Document No' +'</th>';
            doc += '<th style="background-color: #87cefa;">'+ 'Transaction Date' +'</th>';
            doc += '<th style="background-color: #87cefa;">'+ 'Document Text' +'</th>';           
            doc += '<th style="background-color: #87cefa;">'+ 'Debit' +'</th>';
            doc += '<th style="background-color: #87cefa;">'+ 'Credit' +'</th>';
            doc += '<th style="background-color: #87cefa;">'+ 'Balance' +'</th>';
            
        doc += '</tr>';
        // Add the data rows
        this.data3.forEach(record => {
            
            doc += '<tr>';
            doc += '<th>'+record.DocumentNo+'</th>'; 
            doc += '<th>'+record.Dates+'</th>'; 
            doc += '<th>'+record.Narration+'</th>';
            doc += '<th>'+record.Debit+'</th>';
            doc += '<th>'+record.Credit+'</th>';
            doc += '<th>'+record.balance+'</th>';
            doc += '</tr>';
        });
        doc += '</table>';
        var element = 'data:application/vnd.ms-excel,' + encodeURIComponent(doc);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        // use .csv as extension on below line if you want to export data as csv
        downloadElement.download = 'Account Ledger.xls';
        document.body.appendChild(downloadElement);gt
        downloadElement.click();
        }
    
}
