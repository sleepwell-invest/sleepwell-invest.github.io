const form=document.querySelector('#retirementForm');
const results=document.querySelector('#results');
const errorBox=document.querySelector('#error');
const moneyIds=['monthlyExpense','monthlyIncome','currentAssets'];
const money=n=>'NT$ '+Math.round(Math.max(0,n)).toLocaleString('zh-TW');
const num=id=>Number(String(document.querySelector('#'+id).value).replace(/,/g,''))||0;

moneyIds.forEach(id=>{const el=document.querySelector('#'+id);el.addEventListener('input',()=>{const caret=el.selectionStart;const raw=el.value.replace(/\D/g,'');el.value=raw?Number(raw).toLocaleString('zh-TW'):'';try{el.setSelectionRange(caret,caret)}catch{}})});
const incomeUnknown=document.querySelector('#incomeUnknown');
incomeUnknown.addEventListener('change',()=>{const el=document.querySelector('#monthlyIncome');if(incomeUnknown.checked){el.dataset.previous=el.value;el.value='20,000';el.disabled=true}else{el.disabled=false;el.value=el.dataset.previous||'30,000'}});

function monthlyRate(annual){return Math.pow(1+annual/100,1/12)-1}
function realMonthlyRate(annual,inflation){return Math.pow((1+annual/100)/(1+inflation/100),1/12)-1}
function annuityPV(payment,rate,months){return Math.abs(rate)<1e-9?payment*months:payment*(1-Math.pow(1+rate,-months))/rate}
function calculate(){
  const currentAge=num('currentAge'), retireAge=num('retireAge'), planAge=num('planAge');
  const expense=num('monthlyExpense'), income=num('monthlyIncome'), assets=num('currentAssets');
  const inflation=num('inflation'), preReturn=num('preReturn'), postReturn=num('postReturn');
  if(currentAge<18||retireAge<=currentAge||planAge<=retireAge||expense<=0){
    errorBox.textContent='請確認：退休年齡需大於現在年齡、規劃年齡需大於退休年齡，且生活費需大於 0。';errorBox.classList.add('show');return;
  }
  errorBox.classList.remove('show');
  const preYears=retireAge-currentAge, retirementYears=planAge-retireAge;
  const firstGap=Math.max(0,expense-income);
  const months=retirementYears*12;
  const postRealMonthly=realMonthlyRate(postReturn,inflation);
  const capitalNeed=annuityPV(firstGap,postRealMonthly,months);
  const preRealAnnual=(1+preReturn/100)/(1+inflation/100)-1;
  const futureAssets=assets*Math.pow(1+preRealAnnual,preYears);
  const shortfall=Math.max(0,capitalNeed-futureAssets);
  const savingMonths=preYears*12, preMonthly=realMonthlyRate(preReturn,inflation);
  const factor=preMonthly===0?savingMonths:(Math.pow(1+preMonthly,savingMonths)-1)/preMonthly;
  const monthlySaving=factor>0?shortfall/factor:shortfall;
  const coverage=Math.min(100,income/expense*100);
  const stageCapital=shortfall>0?Math.min(1000000,shortfall):0;
  const stageMonthly=factor>0?stageCapital/factor:stageCapital;
  const oneDollarIncomeNeed=annuityPV(1,postRealMonthly,months);
  const stageIncome=oneDollarIncomeNeed>0?stageCapital/oneDollarIncomeNeed:0;

  document.querySelector('#timelineText').textContent=`距離退休 ${preYears} 年，預計準備 ${retirementYears} 年的退休生活`;
  document.querySelector('#monthlyGap').textContent=money(firstGap);
  document.querySelector('#gapExplain').textContent=`目標生活費 ${money(expense)} − 穩定收入 ${money(income)}（今天幣值）`;
  document.querySelector('#coverage').textContent=Math.round(coverage)+'%';
  document.querySelector('#gapPercent').textContent=Math.round(100-coverage)+'%';
  document.querySelector('#incomeBar').style.width=coverage+'%';
  document.querySelector('#resultPreYears').textContent=preYears+' 年';
  document.querySelector('#resultRetYears').textContent=retirementYears+' 年';
  document.querySelector('#coverageCard').textContent=Math.round(coverage)+'%';
  document.querySelector('#capitalNeed').textContent=money(capitalNeed);
  document.querySelector('#futureAssets').textContent=money(futureAssets);
  document.querySelector('#monthlySaving').textContent=money(monthlySaving);
  document.querySelector('#shortfall').textContent=money(shortfall);
  document.querySelector('#stageIncome').textContent=money(stageIncome);
  document.querySelector('#stageCapital').textContent=money(stageCapital);
  document.querySelector('#stageMonthly').textContent=money(stageMonthly);
  document.querySelector('#stageExplain').textContent=shortfall===0?'依目前假設，既有資產已可支應目標。':'先完成第一個可衡量的目標，再逐步往下一階段前進。';
  document.querySelector('#statusMessage').textContent=shortfall===0?'依目前假設，既有資產已可支應目標。仍建議保留醫療與緊急預備金。':'以第一個 '+money(stageCapital)+' 為目標，不用一開始就背負全部退休金。';
  results.hidden=false;
  results.scrollIntoView({behavior:'smooth',block:'start'});
  window.lastResult={currentAge,retireAge,planAge,preYears,retirementYears,expense,income,firstGap,capitalNeed,futureAssets,shortfall,monthlySaving,stageMonthly,stageIncome,stageCapital,inflation,preReturn,postReturn};
}

form.addEventListener('submit',e=>{e.preventDefault();calculate()});
document.querySelector('#recalculate').addEventListener('click',()=>{form.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#currentAge').focus()});
document.querySelector('#copyResult').addEventListener('click',async()=>{
  const r=window.lastResult;if(!r)return;
  const text=`【我的退休現金流行動試算】\n距離退休：${r.preYears} 年\n預計退休生活：${r.retirementYears} 年\n目標月生活費：${money(r.expense)}\n穩定月收入：約 ${money(r.income)}\n每月現金流缺口：約 ${money(r.firstGap)}\n第一階段目標：${money(r.stageCapital)}\n現在每月先準備：約 ${money(r.stageMonthly)}\n達標後約可支應每月：${money(r.stageIncome)}\n\n以上皆以今天幣值估算。假設：通膨 ${r.inflation}%、退休前報酬 ${r.preReturn}%、退休後報酬 ${r.postReturn}%\n本結果為概略試算，不構成財務建議。`;
  const btn=document.querySelector('#copyResult');
  try{await navigator.clipboard.writeText(text);btn.textContent='已複製，可以貼給我了 ✓'}catch{btn.textContent='請長按畫面截圖保存'}
  setTimeout(()=>btn.textContent='複製試算結果',2600);
});
