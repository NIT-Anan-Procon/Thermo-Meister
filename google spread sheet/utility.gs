//�w�肵����̍ŏI�s���擾����
function getLastRows(page,wantcol){
  var from = page.getRange(1, wantcol).getA1Notation();
  var to = page.getRange(page.getLastRow(), wantcol).getA1Notation();
  var result = page.getRange(from+":"+to).getValues().filter(String).length;
  return result;
}

//�w�肵�����O�̗��T��
function checktargetcol(checkrange, page, interval){
  var lastcol = page.getLastColumn();
  var module = page.getRange(1,1,1,lastcol).getValues();
  for(k=0;k<lastcol;k+=interval){
    if(checkrange==module[0][k]){
      return k;
    }
  }
}

//�X�v���b�h�V�[�g��T��
function openspreadsheet(){
  var openrange = originrng.offset(3, 1).getValue();
  for(var i=1; i<=getLastRows(dataID,1); i++){
    if(openrange==datarng.offset(i,0).getValue()){
      return SpreadsheetApp.openById(datarng.offset(i,1).getValue());
      break;
    }
  }
}