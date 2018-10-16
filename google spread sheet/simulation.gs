//シミュレーションの開始
function simulation(){
  destroyGraph(mainpage.getCharts());
  destroyGraph(simulationpage.getCharts());
  destroyGraph(detailpage.getCharts());
  var lastrow = getLastRows(view,1);
  var lastcol = view.getLastColumn();
  var m = Moment.moment(view.getRange(lastrow, 1).getValue());
  var future = [[m.add(1, "day").format("YYYY/MM/DD")],
                [m.add(1, "day").format("YYYY/MM/DD")],
                [m.add(1, "day").format("YYYY/MM/DD")]];
  view.getRange(lastrow+1,1,3,1).setValues(future);
  view.getRange(lastrow,lastcol+1).setValue(view.getRange(lastrow,2).getValue());
  view.getRange(lastrow,lastcol+1,1100,1).setNumberFormat('0.0');

  //平均温度 湿度 降水量 降水の有無 風速
  var url = makeurl(m,["TMP_max","RH","APCP","OPR","WIND"],2);
  write_csv(url,lastrow,lastcol);
  
  var chart = simulationpage.newChart()
              .setOption('title', "換気率判断支援")
              .setOption('legend', {position: 'none'})
              .setOption('useFirstColumnAsDomain', true)
              .setOption('vAxis.viewWindow.min', 0)
              .setOption('series', {
                 0: {color:'red'},
                 1: {color:'red',lineDashStyle:[4, 4]}
               })
              .addRange(view.getRange("A:A"))
              .addRange(view.getRange("B:B"))
              .addRange(view.getRange("F:F"))
              .setPosition(1,5,0,0)
              .setChartType(Charts.ChartType.LINE)
              .build();
                        
  simulationpage.insertChart(chart);
  
}

//取得したcsvデータの処理
function write_csv(url,lastrow,lastcol){
  var result = [];
  lastcol++;
  var vent = loadventilationdata(simulationrng.offset(8,1).getValue());
  simulationrng.offset(8,2).setValue(vent);
  for(var i=0; i<url.length; i++){
    var data =  load_csv(url[i]);
    var weight = [ 0.245, 0.273, 0.319, 0.146 ]
    for (var ii=1; ii < data.length-2; ii++){
      var x = parseFloat(data[ii+1][1]);
      if(i==0){
        
        result.push([ x ]);
        
      }else if(i==1){
        //y_1=            (-0.0099 *     x^2       + 1.1894 * x-20.307) * w_1
        result[ii-1][0]+= (-0.0099 * Math.pow(x,2) + 1.1894 * x-20.307) * weight[0];
        
      }else if(i==2){	
        //y_3=                                             14.24 * w_3
        if(parseFloat(data[ii+1][1])<=0) result[ii-1][0]+= 14.24 * weight[1];
        //y_3=                                             (-4.886 *    ln(x)    + 15.432) * w_3
        else 　　　　　　　　　　　　　　　   result[ii-1][0]+= (-4.886 * Math.log(x) + 15.432) * weight[1];
        
      }else if(i==3){
        //y_2=            (-6.9277 * x + 14.308) * w_2
        result[ii-1][0]+= (-6.9277 * x + 14.308) * weight[2];
        
      }else if(i==4){
        //y_4=            (-1 *   {(x-2.83)}^2     + ( 16.008 *      EXP(-0.517 * z_換気率) ) ) * w_4
        result[ii-1][0]+= (-1 * Math.pow(x-2.83,2) + ( 16.008 * Math.exp(-0.517 * vent   ) ) ) * weight[3];
        view.getRange(ii+lastrow, lastcol).setValue(result[ii-1]);
      }
    }
  }
}

//データ取得urlの生成
function makeurl(m,want_data,count) {
  var result = [];
  var elementcount = [480,640];
  var ntlat = 32.66666667,eastlot = 130;
  var lat_element = parseInt((34.06093476-ntlat)/(2/3/8/10));
  var lot_element = parseInt((134.4401801-eastlot)/(1/8/10));
  
  var year = m.year();
  var daysdiff= m.diff(Moment.moment(year+'/1/1'), 'd');
  
  if((0<=lat_element&&lat_element<elementcount[0]) && (0<=lot_element&&lot_element<elementcount[1])){
    for(var i=0; i<want_data.length; i++){
      result[i]="https://amd.rd.naro.go.jp/opendap/AMD/Area4/"+String(year)+"/AMD_Area4_"+want_data[i]+
        ".nc.ascii?"+want_data[i]+"["+daysdiff+":"+(daysdiff+count)+"]"+"["+lat_element+"]"+"["+lot_element+"]";
    }
  }
  return result;
}

//csvの読み込み
function load_csv(url){
  var csv_txt = download_csv(url);
  var data = CSVToArray(csv_txt, ',');
  return data;
}

//csvダウンロード
function download_csv(url) {
  var user = "yoshidas_anan-nct";
  var pass = "sokJHxs72018";
  var options = {
    "headers" : {"Authorization" : " Basic " + Utilities.base64Encode(user + ":" + pass)},
    "muteHttpExceptions" : true
  };
  var res = UrlFetchApp.fetch(url,options);
  var content = res.getContentText('UTF-8');
  return content.toString();
}

//csvデータの配列化
function CSVToArray( strData, strDelimiter ){
  var objPattern = new RegExp(
  (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );

  var arrData = [[]];
  var arrMatches = null;

  while (arrMatches = objPattern.exec( strData )){
    var strMatchedDelimiter = arrMatches[ 1 ];
    if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) arrData.push( [] );
    if (arrMatches[ 2 ]){
      var strMatchedValue = arrMatches[ 2 ].replace( new RegExp( "\"\"", "g" ),"\"" );
    }else{
      var strMatchedValue = arrMatches[ 3 ];
    }
    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }
  return( arrData );
}
