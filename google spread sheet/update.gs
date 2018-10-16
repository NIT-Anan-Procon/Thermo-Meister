//自動アップデートトリガー
function allupdate(){
  var modulecol = datapage[1].getLastColumn();
  var modulename = datapage[1].getRange(1,1,1,modulecol).getValues();
  var progressrng = mainpage.getRange(4,8,1,2);
  for(var module = 0; module <= modulecol;module+=3){
    progressrng.setValues([[modulename[0][module],"更新中…"]]);
    for(var i=1; i<=4; i++){
      rowtargetcol=checktargetcol(modulename[0][module],datapage[i],3);
      rowlastlow=getLastRows(datapage[i],rowtargetcol+1);
      backgroundupdate(datapage[i]);
      var flag = SakuraDataGet_oneday(modulename[0][module], datapage[i], channel[i]);
      if(flag==1)break;
    }
    progressrng.setValues([[modulename[0][module],"更新完了"]]);
  }
  progressrng.setValues([["",""]]);
}

//現在のデータがどこまで保存されているか確認
function backgroundupdate(datapage){
  var dat = datapage.getDataRange().getValues();
  var val = Moment.moment(dat[rowlastlow-1][rowtargetcol]).zone("+09:00");
  
  for(var i=2;i<dat.length;i++){
    var target = Moment.moment(dat[i][rowtargetcol]).zone("+09:00");
    if(target.isSame(val, 'day') || i==dat.length-1){
      originrng.offset(16, 2).setValue(target.month()+1);
      originrng.offset(16, 3).setValue(target.date());
      var today = Moment.moment().zone("+09:00");
      originrng.offset(16, 6).setValue(today.month()+1);
      originrng.offset(16, 7).setValue(today.date());
      rowlastlow=i;
      break;
    }
  }
}
