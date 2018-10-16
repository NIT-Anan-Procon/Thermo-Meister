//�d�ˍ��킹����
function overlaid(){
  var check = mainpage.getCharts()[0];
  var checkbox = mainpage.getRange(12,7,3,1);
  if(check.getOptions().get('title').slice(0,5)=="���x-��-" || check.getOptions().get('title').slice(0,9)=="�ō����x�d�ˍ��킹"){
    destroyGraph();
    downloadOtherData();
    maxTempdoubleGraph();
  }else{
    Browser.msgBox("���x�O���t�ł͂Ȃ��̂ŏd�˂��܂���");
  }
}

//�d�ˍ��킹�ŕK�v�ȃf�[�^���擾
function downloadOtherData(){
  view.getRange(1,7,view.getLastColumn(),1).clear();
  var range;
  var target = datapage[0].getDataRange().getValues();
  var date = Moment.moment(view.getRange(1,1).getValue());
  var lastcol = datapage[0].getLastColumn();
  rowtargetcol = checktargetcol(originrng.offset(12, 1).getValue(), datapage[0], 5)
  rowlastlow = getLastRows(datapage[0],rowtargetcol+1);
  for(var i=2; i<rowlastlow; i++){
    if(date.isSame(Moment.moment(target[i][rowtargetcol]),'day')){
      var hoge = datapage[0].getRange(i+1,rowtargetcol+2,rowlastlow-i,1).getValues();
      range = view.getRange(1,view.getLastColumn()+2,rowlastlow-i,1);
      range.setValues(hoge);
      range.setNumberFormat('0.0');
      break;
    }
  }
}

//�d�ˍ��킹���O���t�𐶐�
function maxTempdoubleGraph(){
  var firstmodule =  originrng.offset(7,1).getValue();
  var secondmodule = originrng.offset(12,1).getValue();
  var chart = mainpage.newChart()
              .setOption('title', "�ō����x�d�ˍ��킹("+firstmodule+"+"+secondmodule+")")
              .setOption('legend', {position: 'none'})
              .setOption('useFirstColumnAsDomain', true)
              .setOption('series', {
                 0: {color:'red'},
                 1: {color:'blue'},
               })
              .addRange(view.getRange(1,1,view.getLastColumn(),2))
              .addRange(view.getRange(1,7,view.getLastColumn(),1))
              .setPosition(graphYposition,graphXposition,0,0)
              .setChartType(Charts.ChartType.LINE)
              .build();
  mainpage.insertChart(chart);
  originrng.offset(19,14,1,4).setValues([["�ԁF"+firstmodule,"�F"+secondmodule," "," "]]);
}

//�O���t�`��
function makeGraph(page,range){
  var chart = page.newChart()
              .setOption('title', title+"("+page.getRange(8,2).getValue()+")")
              .setOption('legend', {position: 'none'})
              .setOption('useFirstColumnAsDomain', true)
              .setOption('series', {
                 0: {color:'red'},
                 1: {color:'blue'},
                 2: {color:'yellow'},
                 3: {color:'Orange',lineDashStyle:[4, 4]},
               })
              .addRange(range)
              .setPosition(graphYposition,graphXposition,0,0)
              .setChartType(Charts.ChartType.LINE)
              .build();
  page.insertChart(chart);
  if(graphYposition==20){
    graphYposition = 1;
    graphXposition = 22;
  }else{
    graphYposition +=19;
  }
}

//�O���t���폜����
function destroyGraph(charts){
  for (var i in charts)mainpage.removeChart(charts[i]);
}
//