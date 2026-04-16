
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*******************************************************************
 *@description  Updates tax amount for Item fulfillment.
 * ****************************************************************/

define(['N/currentRecord', 'N/search', 'N/record',"SuiteScripts/pts_helper"],
    /**
     * @param{currentRecord} currentRecord
     */
    (currentRecord, search,record, util) => {

        const beforeLoad = (scriptContext) => {
            /**
             * Defines the function definition that is executed before record is loaded.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @param {Form} scriptContext.form - Current form
             * @since 2015.2
             */

        }


        /**
              * Defines the function definition that is executed before record is submitted.
              * @param {Object} scriptContext
              * @param {Record} scriptContext.newRecord - New record
              * @param {Record} scriptContext.oldRecord - Old record
              * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
              * @since 2015.2
              */
        const beforeSubmit = (scriptContext) => {
            try {

                var oldRecord = scriptContext.oldRecord;
                var newRecord = scriptContext.newRecord;
                var recType = newRecord.type;
                log.debug("new Record ",newRecord);

                var createdRecType,taxTotal=0;
                if (oldRecord !== newRecord) {
                    let createdFromId = newRecord.getValue({fieldId:'createdfrom'});
                    log.debug("createdFrom",createdFromId);

                    if (createdFromId) {
                        try{
                        let transferOrderType = search.lookupFields({
                            type: 'transaction',
                            id: createdFromId,
                            columns: ['recordtype','custbody_pts_eipw_stocktrnsfrtax']
                        });
        
                        createdRecType = transferOrderType.recordtype ;
                             taxTotal = parseFloat(transferOrderType.custbody_pts_eipw_stocktrnsfrtax);
                             if (createdRecType=== 'transferorder' && taxTotal>0) {
                            
                                setTaxForItem(recType,newRecord,createdFromId);
 
 
                         }
                    
                    }catch(e){log.error("error @ fetching to details",e);}
                }
            }

            } catch (e) {
                log.error("error @ beforeSubmit", e);
            }

        }


        /**
           * @description calculates the tax total and set the tax amount for items on button click
           */
        function setTaxForItem(recType,rec,transferOrderId) {
            try {
           
                let IF_ItemLines = util.getLines(rec,'item',['item','custcol_lineuniquekey_tra','quantity','custcol_pts_eipw_trigstlineamount'])
              
                let transferOrderRec =  record.load({
                    type: record.Type.TRANSFER_ORDER,
                    id: transferOrderId,
                });
            //    let isTaxable = checkTaxable(transferOrder);
               // if (isTaxable) {
                    let totalTaxAmount = 0;
                    // calculate taxamount for each element and set taxTotal in line level
                    IF_ItemLines.forEach(function (element) {
                       //  log.debug("element",element);
                        let lineNum = element.i;
                        let item = element.item;
                        let lineTotal = parseFloat(element.custcol_pts_eipw_trigstlineamount);
                        let fulfillQuantity = parseInt(element.quantity);
                        let lineUniqueKey = element.custcol_lineuniquekey_tra;
                       let lineIndex = transferOrderRec.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'custcol_lineuniquekey_tra',
                            value: lineUniqueKey
                        });
                        if(lineIndex>=0){
                            let lineTaxAmount = transferOrderRec.getSublistValue({
                                sublistId:'item',
                                fieldId:'custcol_pts_eipw_trigstlineamount',
                                line:lineIndex
                            });

                            if(parseFloat(lineTaxAmount)>0){

                                let orderQuantity = transferOrderRec.getSublistValue({
                                    sublistId:'item',
                                    fieldId:'quantity',
                                    line:lineIndex
                                });

                                let taxPerItem = (parseFloat(lineTaxAmount)/parseFloat(orderQuantity)).toFixed(2);
                                 let itemLineTax = (taxPerItem * fulfillQuantity).toFixed(2);
                                 if(itemLineTax>0){
                                    rec.setSublistValue({
                                        sublistId:'item',
                                        fieldId:'custcol_pts_eipw_trigstlineamount',
                                        value:itemLineTax,
                                        line:lineNum
                                    });
                                    totalTaxAmount = totalTaxAmount+ parseFloat(itemLineTax);
                            }
                        }
                    }
            
                    });
                    log.debug("totalTaxAmount", totalTaxAmount);
                   
                    rec.setValue({ fieldId: 'custbody_pts_eipw_stocktrnsfrtax', value: totalTaxAmount.toFixed(2)});
            } catch (err) {
                log.error({ title: "Error in setTaxForItem", details: err.message });
            }
        }

/**
* @description checks if given value is empty,null or undefined
* @param {} s 
* @returns {BOOLEAN} 
*/
        function isNullorDefault(s) {
            if (s == undefined || s == null || s == "" || Number(s) == 0)
                return true;
            else
                return false;
        }


        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };

    });
