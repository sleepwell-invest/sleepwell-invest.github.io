(function(root,factory){
  const compute=factory();
  if(typeof module==='object'&&module.exports)module.exports=compute;
  if(root)root.computePropertyModel=compute;
})(typeof window!=='undefined'?window:null,function(){
  return function computePropertyModel(input){
    const propertyValue=Math.max(0,Number(input.propertyValue)||0);
    const loanBalance=Math.max(0,Number(input.loanBalance)||0);
    const monthlyMortgage=Math.max(0,Number(input.monthlyMortgage)||0);
    const ltv=Math.max(0,Number(input.ltv)||0);
    const loanRate=Math.max(0,Number(input.loanRate)||0);
    const cashflowRate=Math.max(0,Number(input.cashflowRate)||0);
    const totalLoanable=propertyValue*ltv/100;
    const available=Math.max(0,totalLoanable-loanBalance);
    const gross=available*cashflowRate/100/12;
    const cost=available*loanRate/100/12;
    const net=Math.max(0,gross-cost);
    const coverage=monthlyMortgage>0?Math.min(100,net/monthlyMortgage*100):0;
    const afterBurden=monthlyMortgage>0?Math.max(0,monthlyMortgage-net):0;
    const surplus=monthlyMortgage>0?Math.max(0,net-monthlyMortgage):0;
    return {propertyValue,loanBalance,monthlyMortgage,ltv,loanRate,cashflowRate,totalLoanable,available,gross,cost,net,coverage,afterBurden,surplus};
  };
});
