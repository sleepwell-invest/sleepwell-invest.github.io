const form=document.querySelector('#retirementForm');
const results=document.querySelector('#results');
const errorBox=document.querySelector('#error');
const moneyIds=['monthlyExpense','monthlyIncome','currentAssets'];
const money=n=>'NT$ '+Math.round(Math.max(0,n)).toLocaleString('zh-TW');
const num=id=>Number(String(document.querySelector('#'+id).value).replace(/,/g,''))||0;

moneyIds.forEach(id=>{const el=document.querySelector('#'+id);el.addEventListener('input',()=>{const caret=el.selectionStart;const raw=el.value.replace(/\D/g,'');el.value=raw?Number(raw).toLocaleString('zh-TW'):'';try{el.setSelectionRange(caret,caret)}catch{}})});

function monthlyRate(annual){return Math.pow(1+annual/100,1/12)-1}
function calculate(){
  const currentAge=num('currentAge'), retireAge=num('retireAge'), planAge=num('planAge');
  const expense=num('monthlyExpense'), income=num('monthlyIncome'), assets=num('currentAssets');
  const inflation=num('inflation'), preReturn=num('preReturn'), postReturn=num('postReturn');
  if(currentAge<18||retireAge<=currentAge||planAge<=retireAge||expense<=0){
    errorBox.textContent='請確認：退休年齡需大於現在年齡、規劃年齡需大於退休年齡，且生活費需大於 0。';errorBox.classList.add('show');return;
  }
  errorBox.classList.remove('show');
  const preYears=retireAge-currentAge, retirementYears=planAge-retireAge;
  const futureExpense=expense*Math.pow(1+inflation/100,preYears);
  const firstGap=Math.max(0,futureExpense-income);
  const r=monthlyRate(postReturn), g=monthlyRate(inflation), months=retirementYears*12;
  let capitalNeed=0;
  for(let m=0;m<months;m++){
    const monthlyExpense=futureExpense*Math.pow(1+g,m);
    const gap=Math.max(0,monthlyExpense-income);
    capitalNeed+=gap/Math.pow(1+r,m+1);
  }
  const futureAssets=assets*Math.pow(1+preReturn/100,preYears);
  const shortfall=Math.max(0,capitalNeed-futureAssets);
  const savingMonths=preYears*12, preMonthly=monthlyRate(preReturn);
  const factor=preMonthly===0?savingMonths:(Math.pow(1+preMonthly,savingMonths)-1)/preMonthly;
  const monthlySaving=factor>0?shortfall/factor:shortfall;
  const coverage=Math.min(100,income/futureExpense*100);

  document.querySelector('#timelineText').textContent=`距離退休 ${preYears} 年，預計準備 ${retirementYears} 年的退休生活`;
  document.querySelector('#monthlyGap').textContent=money(firstGap);
  document.querySelector('#gapExplain').textContent=`退休時月生活費 ${money(futureExpense)} − 穩定收入 ${money(income)}`;
  document.querySelector('#coverage').textContent=Math.round(coverage)+'%';
  document.querySelector('#gapPercent').textContent=Math.round(100-coverage)+'%';
  document.querySelector('#incomeBar').style.width=coverage+'%';
  document.querySelector('#futureExpense').textContent=money(futureExpense);
  document.querySelector('#capitalNeed').textContent=money(capitalNeed);
  document.querySelector('#futureAssets').textContent=money(futureAssets);
  document.querySelector('#monthlySaving').textContent=money(monthlySaving);
  document.querySelector('#shortfall').textContent=money(shortfall);
  document.querySelector('#statusMessage').textContent=shortfall===0?'依目前假設，既有資產可支應試算中的退休需求。仍建議保留醫療與緊急預備金。':'這不是保證值，而是讓你知道目前假設下的準備方向。';
  results.hidden=false;
  results.scrollIntoView({behavior:'smooth',block:'start'});
  window.lastResult={currentAge,retireAge,planAge,preYears,retirementYears,futureExpense,income,firstGap,capitalNeed,futureAssets,shortfall,monthlySaving,inflation,preReturn,postReturn};
}

form.addEventListener('submit',e=>{e.preventDefault();calculate()});
document.querySelector('#recalculate').addEventListener('click',()=>{form.scrollIntoView({behavior:'smooth',block:'start'});document.querySelector('#currentAge').focus()});
document.querySelector('#copyResult').addEventListener('click',async()=>{
  const r=window.lastResult;if(!r)return;
  const text=`【我的退休現金流試算】\n距離退休：${r.preYears} 年\n預計退休生活：${r.retirementYears} 年\n退休時月生活費：約 ${money(r.futureExpense)}\n退休後穩定月收入：約 ${money(r.income)}\n每月現金流缺口：約 ${money(r.firstGap)}\n退休準備金需求：約 ${money(r.capitalNeed)}\n目前資產退休時預估值：約 ${money(r.futureAssets)}\n退休準備金仍差：約 ${money(r.shortfall)}\n現在每月約需準備：${money(r.monthlySaving)}\n\n假設：通膨 ${r.inflation}%、退休前報酬 ${r.preReturn}%、退休後報酬 ${r.postReturn}%\n本結果為概略試算，不構成財務建議。`;
  const btn=document.querySelector('#copyResult');
  try{await navigator.clipboard.writeText(text);btn.textContent='已複製，可以貼給我了 ✓'}catch{btn.textContent='請長按畫面截圖保存'}
  setTimeout(()=>btn.textContent='複製試算結果',2600);
});
