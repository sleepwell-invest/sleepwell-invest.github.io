const form=document.querySelector('#propertyForm');
const results=document.querySelector('#results');
const errorBox=document.querySelector('#error');
const moneyIds=['propertyValue','loanBalance','monthlyMortgage'];
const money=n=>'NT$ '+Math.round(Math.max(0,n)).toLocaleString('zh-TW');
const num=id=>Number(String(document.querySelector('#'+id).value).replace(/,/g,''))||0;

moneyIds.forEach(id=>{
  const el=document.querySelector('#'+id);
  el.addEventListener('input',()=>{
    const raw=el.value.replace(/\D/g,'');
    el.value=raw?Number(raw).toLocaleString('zh-TW'):'';
  });
});

function calculate(){
  const propertyValue=num('propertyValue');
  const loanBalance=num('loanBalance');
  const monthlyMortgage=num('monthlyMortgage');
  const ltv=num('ltv');
  const loanRate=num('loanRate');
  const cashflowRate=num('cashflowRate');

  if(propertyValue<=0||loanBalance<0||ltv<=0||ltv>90||loanRate<0||cashflowRate<0){
    errorBox.textContent='請確認房屋估值大於0、核貸成數介於1%到90%，其他數字不可小於0。';
    errorBox.classList.add('show');
    return;
  }
  errorBox.classList.remove('show');

  const model=window.computePropertyModel({propertyValue,loanBalance,monthlyMortgage,ltv,loanRate,cashflowRate});
  const {totalLoanable,available,gross,cost,net,coverage,afterBurden,surplus}=model;

  document.querySelector('#resultFormula').textContent=`${money(propertyValue)} × ${ltv}% − ${money(loanBalance)}`;
  document.querySelector('#availableCapital').textContent=money(available);
  document.querySelector('#grossCashflow').textContent=money(gross);
  document.querySelector('#fundingCost').textContent=money(cost);
  document.querySelector('#netCashflow').textContent=money(net);
  document.querySelector('#cashflowAssumption').textContent=`年化現金流 ${cashflowRate}%`;
  document.querySelector('#loanAssumption').textContent=`增貸利率 ${loanRate}%`;

  const impact=document.querySelector('#mortgageImpact');
  const surplusHighlight=document.querySelector('#surplusHighlight');
  const surplusMessage=document.querySelector('#surplusMessage');
  if(monthlyMortgage>0){
    impact.hidden=false;
    document.querySelector('#beforeBurden').textContent=money(monthlyMortgage);
    document.querySelector('#afterBurden').textContent=money(afterBurden);
    document.querySelector('#coverageText').textContent=surplus>0?'房貸可完全分擔':`可分擔 ${Math.round(coverage)}%`;
    document.querySelector('#coverageBar').style.width=coverage+'%';
    document.querySelector('#afterLabel').textContent=surplus>0?'房貸分擔後仍有剩餘':'每月仍需由薪水負擔';
    if(surplus>0){
      impact.classList.add('has-surplus');
      surplusHighlight.hidden=false;
      document.querySelector('#surplusAmount').textContent=money(surplus);
      surplusMessage.textContent='';
    }else{
      impact.classList.remove('has-surplus');
      surplusHighlight.hidden=true;
      surplusMessage.textContent=`每月新的現金流，試算可替薪水分擔約 ${money(Math.min(net,monthlyMortgage))} 房貸。`;
    }
  }else{
    impact.hidden=true;
    impact.classList.remove('has-surplus');
    surplusHighlight.hidden=true;
  }

  if(available<=0){
    document.querySelector('#netCashflow').textContent='目前無可用空間';
  }

  window.lastResult={propertyValue,loanBalance,monthlyMortgage,ltv,loanRate,cashflowRate,totalLoanable,available,gross,cost,net,coverage,afterBurden,surplus};
  results.hidden=false;
  results.scrollIntoView({behavior:'smooth',block:'start'});
}

form.addEventListener('submit',event=>{event.preventDefault();calculate()});
document.querySelector('#recalculate').addEventListener('click',()=>{
  form.scrollIntoView({behavior:'smooth',block:'start'});
  document.querySelector('#propertyValue').focus();
});

document.querySelector('#copyResult').addEventListener('click',async()=>{
  const r=window.lastResult;
  if(!r)return;
  const burden=r.monthlyMortgage>0?`\n目前每月房貸：約 ${money(r.monthlyMortgage)}\n活化後薪水試算負擔：約 ${money(r.afterBurden)}\n現金流可分擔：約 ${Math.round(r.coverage)}%`:'';
  const text=`【我的房產活化現金流試算】\n房屋估值：約 ${money(r.propertyValue)}\n房貸餘額：約 ${money(r.loanBalance)}\n預估核貸成數：${r.ltv}%\n可能的資金運用空間：約 ${money(r.available)}\n每月現金流：約 ${money(r.gross)}\n每月資金成本：約 ${money(r.cost)}\n扣除成本後每月約：${money(r.net)}${burden}\n\n試算假設：增貸利率 ${r.loanRate}%、年化現金流 ${r.cashflowRate}%\n本結果為概念試算，不代表銀行核貸或保證投資結果。`;
  const button=document.querySelector('#copyResult');
  try{
    await navigator.clipboard.writeText(text);
    button.textContent='已複製，可以貼給我了 ✓';
  }catch{
    button.textContent='請長按畫面截圖保存';
  }
  setTimeout(()=>button.textContent='複製我的試算結果',2600);
});
