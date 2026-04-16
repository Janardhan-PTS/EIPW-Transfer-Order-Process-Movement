/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

 define(["SuiteScripts/pts_helper", "N/record", "N/currentRecord", "N/runtime"],
 function (util, record, currentRecord, runtime) {

     function afterSubmit(context) {
        try{
         var newRecCurrent = context.newRecord;
         log.debug('newRec', newRec);

         var tranType = newRecCurrent.type;
         log.debug('tranType', tranType);

         var recId = newRecCurrent.id;
         log.debug('recId', recId);

         var newRec = record.load({ type: tranType, id: recId })

         if (tranType == 'salesorder' || tranType == 'invoice' || tranType == 'purchaseorder' || tranType == 'transferorder' || tranType == 'vendorpayment' || tranType == 'returnauthorization' || tranType == 'creditmemo' || tranType == 'cashsale' || tranType == 'customerrefund') {

             var totAmount = newRec.getValue({ fieldId: 'total'})
             log.debug('totAmount', totAmount);

             var totGStAmount = newRec.getValue({ fieldId: 'taxtotal'})
             log.debug('totGStAmount', totGStAmount);

             var getCurrency = newRec.getValue({fieldId: 'currency'})
             log.debug('getCurrency', getCurrency);

             var convertAmountTotal = convertAmtToText(getCurrency, totAmount);
             log.debug('convertAmountTotal', convertAmountTotal);

             newRec.setValue({ fieldId: 'custbody_ocr_tot_amt_to_wrd', value: convertAmountTotal })

             if (totGStAmount) {
                 var convertAmountGST = convertAmtToText(getCurrency, totGStAmount);
                 log.debug('convertAmountGST', convertAmountGST);

                 newRec.setValue({ fieldId: 'custbody_ocr_tot_gst_amt_wrds', value: convertAmountGST})
             }
           else{
             newRec.setValue({ fieldId: 'custbody_ocr_tot_gst_amt_wrds', value: 'Zero'})
           }
         }
         if (tranType == 'vendorbill' || tranType == 'vendorreturnauthorization' || tranType == 'vendorcredit' || tranType == 'check') {

             var totAmount = newRec.getValue({ fieldId: 'usertotal'})
             log.debug('totAmount', totAmount);

             var totGStAmount = newRec.getValue({ fieldId: 'usertaxtotal'})
             log.debug('totGStAmount', totGStAmount);

             var getCurrency = newRec.getValue({ fieldId: 'currency'})
             log.debug('getCurrency', getCurrency);

             var convertAmountTotal = convertAmtToText(getCurrency, totAmount);
             log.debug('convertAmountTotal', convertAmountTotal);

             newRec.setValue({ fieldId: 'custbody_ocr_tot_amt_to_wrd',value: convertAmountTotal})

             if (totGStAmount) {
                 var convertAmountGST = convertAmtToText(getCurrency, totGStAmount);
                 log.debug('convertAmountGST', convertAmountGST);

                 newRec.setValue({ fieldId: 'custbody_ocr_tot_gst_amt_wrds',value: convertAmountGST})
             }
           else{
              newRec.setValue({ fieldId: 'custbody_ocr_tot_gst_amt_wrds',value: 'Zero'})
           }
         }
         if (tranType == 'vendorprepayment') {

             var totAmount = newRec.getValue({ fieldId: 'payment'})
             log.debug('totAmount', totAmount);

             var getCurrency = newRec.getValue({ fieldId: 'currency'})
             log.debug('getCurrency', getCurrency);

             var convertAmountTotal = convertAmtToText(getCurrency, totAmount);
             log.debug('convertAmountTotal', convertAmountTotal);

             newRec.setValue({ fieldId: 'custbody_ocr_tot_amt_to_wrd',value: convertAmountTotal})

         }
         if (tranType == 'customerpayment') {
            var totAmount = newRec.getValue({fieldId: 'applied'})
            log.debug('totAmount', totAmount);

            var totpayment = newRec.getValue({fieldId: 'payment'})
            log.debug('totpayment', totpayment);

            var paymenttotal = newRec.getValue({fieldId: 'total'})
            log.debug('paymenttotal', paymenttotal);

            var getCurrency = newRec.getValue({fieldId: 'currency'})
            log.debug('getCurrency', getCurrency);

            var convertAmountTotal = convertAmtToText(getCurrency, totAmount);
            log.debug('convertAmountTotal', convertAmountTotal);

            newRec.setValue({ fieldId: 'custbody_ocr_tot_amt_to_wrd',value: convertAmountTotal})

        }//customer payment end

        var savId = newRec.save({ enableSourcing: true,ignoreMandatoryFields: true});

        }catch(e){
            log.debug('Amount to word After Submit error',e);
        }
     }//after submit end

    
     //----------------------------------Used Functions -------------------------------------------------

     function convertAmtToText(currency, amount) {

         switch (currency) {

             case "1": //INR
                 return numINRWords(amount);

             case "2": //USD
                 return numUSDWords(amount);

             case "3": //CAD
                 return numCADWords(amount);

             case "4": //EUR
                 return numEURWords(amount);

             case "5": //MVR
                 return numMVRWords(amount);

             case "6"://BWP":
                 return numBWPWords(amount);

             case "7"://BTN":
                 return numBTNWords(amount);

             case "8": //SGD
                 return numSGDWords(amount);

             case "9": //ILS
                 return numILSWords(amount);

             case "10": //GBP
                 return numGBPWords(amount);
         }

         const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen ']
         const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

         //const regex = /^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/

         //const getLT20 = (n) => a[Number(n)]
         //const getGT20 = (n) => b[n[0]] + ' ' + a[n[1]]

         function convert_number(number) {
             if ((number < 0) || (number > 999999999)) {
                 return "NUMBER OUT OF RANGE!";
             }
             var Gn = Math.floor(number / 10000000); / Crore /
             number -= Gn * 10000000;
             var kn = Math.floor(number / 100000); / lakhs /
             number -= kn * 100000;
             var Hn = Math.floor(number / 1000); / thousand /
             number -= Hn * 1000;
             var Dn = Math.floor(number / 100); / Tens (deca) /
             number = number % 100; / Ones /
             var tn = Math.floor(number / 10);
             var one = Math.floor(number % 10);
             var res = "";

             if (Gn > 0) {
                 res += (convert_number(Gn) + " Crore");
             }
             if (kn > 0) {
                 res += (((res == "") ? "" : " ") +
                     convert_number(kn) + " Lakh");
             }
             if (Hn > 0) {
                 res += (((res == "") ? "" : " ") +
                     convert_number(Hn) + " Thousand");
             }

             if (Dn) {
                 res += (((res == "") ? "" : " ") +
                     convert_number(Dn) + " Hundred");
             }


             var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen");
             var tens = Array("", "", "Twenty", "Thirty", "Fourty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety");

             if (tn > 0 || one > 0) {
                 if (!(res == "")) {
                     res += " "; //AND
                 }
                 if (tn < 2) {
                     res += ones[tn * 10 + one];
                 }
                 else {

                     res += tens[tn];
                     if (one > 0) {
                         res += ("-" + ones[one]);
                     }
                 }
             }

             if (res == "") {
                 res = "zero";
             }
             return res;
         }

         function frac(f) {
             return f % 1;
         }

         function toWordsconver(s) {
             var th = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
             var dg = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
             var tn = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
             var tw = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
             s = s.toString();
             s = s.replace(/[\, ]/g, '');
             if (s != parseFloat(s)) return 'not a number';
             var x = s.indexOf('.');
             if (x == -1)
                 x = s.length;
             if (x > 15)
                 return 'too big';
             var n = s.split('');
             var str = '';
             var sk = 0;
             for (var i = 0; i < x; i++) {
                 if ((x - i) % 3 == 2) {
                     if (n[i] == '1') {
                         str += tn[Number(n[i + 1])] + ' ';
                         i++;
                         sk = 1;
                     } else if (n[i] != 0) {
                         str += tw[n[i] - 2] + ' ';
                         sk = 1;
                     }
                 } else if (n[i] != 0) { // 0235
                     str += dg[n[i]] + ' ';
                     if ((x - i) % 3 == 0) str += 'Hundred ';
                     sk = 1;
                 }
                 if ((x - i) % 3 == 1) {
                     if (sk)
                         str += th[(x - i - 1) / 3] + ' ';
                     sk = 0;
                 }
             }

             if (x != s.length) {
                 var y = s.length;
                 str += 'and '; //point
                 for (var i = x + 1; i < y; i++)
                     str += dg[n[i]] + ' ';
             }
             return str.replace(/\s+/g, ' ');
         }
         

         //***********************************INR************************************* */

         function numINRWords(value) {
             var fraction = Math.round(frac(value) * 100);
             var f_text = "";

             if (fraction > 0) {
                 f_text = " Rupees And " + convert_number(fraction) + " Paisa";
             }
             return /*" RUPEES " +*/ convert_number(value) + f_text + " Only";
         }

         //*************************************USD***********************************/

         function numUSDWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Dollars ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + "Dollars";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Cents ";
                         }
                     }
                 }
             }	//check Currency End
             return wordd + " Only";
         }
         //*********************************CAD ************************************ */

         function numCADWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Dollars ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + "Dollars";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Cents ";
                         }
                     }
                 }
             }	//check Currency End
             return wordd + " Only";
         }

         //*********************************EUR ************************************ */

         function numEURWords(numm) {
             var wordd = "";
             var pattern = /"."/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Euros  ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + "Euros ";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Cents ";
                         }
                     }
                 }
             }	//check Currency End
             return wordd + " Only";
         }

         /*function numEURWords(numm) {
             var wordd = "";
             var pattern = /\./;  
             var numStr = numm.toString();  
             var n = pattern.test(numStr);
             log.debug('n', n);
             if (!n) {
                 wordd += toWordsconver(numStr) + " Euros ";
             } else {
                 var num = numStr.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + " Euros";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Cents";
                         }
                     }
                 }
                 wordd += " Only";
             }
             return wordd;
         }*/
         //*********************************MVR ************************************ */

         function numMVRWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Rufiyaa ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + "Rufiyaa ";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Laari ";
                         }
                     }
                 }
             }	//check Currency End
             return wordd + " Only";
         }
         
         //******************************Botswana or BWP ************************** */

         function numBWPWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + "Pula";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 var wordd = "";
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + " Pula ";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Thebe ";
                         }
                     }
                 }
             }
             return wordd + " Only";
         }

         //****************************** Bhutan or BTN *************************** */

         function numBTNWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Ngultrum ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 var wordd = "";
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + " Ngultrum ";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " chhertum ";
                         }
                     }
                 }
             }
             return wordd + " Only";
         }

         //*********************************SGD ************************************ */

         function numSGDWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Dollars ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + "Dollars";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Cents ";
                         }
                     }
                 }
             }	//check Currency End
             return wordd + " Only";
         }

         //*********************************ILS ************************************ */

         function numILSWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Sheqel ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + "Sheqel ";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Cents ";
                         }
                     }
                 }
             }	//check Currency End
             return wordd + " Only";
         }

         //*********************************GBP ************************************ */

         function numGBPWords(numm) {
             var wordd = "";
             var pattern = /'.'/;
             var n = pattern.test(numm);
             log.debug('n', n);
             if (n == false) {
                 wordd += toWordsconver(numm) + " Pounds  ";;
             }
             if (n == true) {
                 var num = numm.split(".");
                 // Check Currency Start
                 if (num.length != 0) {
                     for (var i = 0; i < num.length; i++) {
                         if (i == 0) {
                             wordd += toWordsconver(num[i]) + "Pounds ";
                         } else {
                             wordd += " and " + toWordsconver(num[i]) + " Pennys ";
                         }
                     }
                 }
             }	//check Currency End
             return wordd + " Only";
         }
     }

     return {
         afterSubmit: afterSubmit
     }
 })