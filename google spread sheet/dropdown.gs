//���t�̐ݒ藓���쐬����
function makedatedropdown(){
  var daterule = SpreadsheetApp
�@�@�@�@�@�@�@�@�@�@.newDataValidation()
�@�@�@�@�@�@�@�@�@�@.requireValueInList(['3', '4', '5', '6', '7'], true)
�@�@�@�@�@�@�@�@�@�@.build();
�@originrng.offset(7, 9).setDataValidation(daterule);
}

//���t���y�[�W����ǂݍ���
function getdropdowndatedata(page,date){
  var today = Moment.moment().zone("+09:00");
  page.getRange(17,7,1,2).setValues([[today.month()+1,today.date()]]);
  today.add(-date, "day");
  page.getRange(17,3,1,2).setValues([[today.month()+1,today.date()]]);
}

//�h���b�v�_�E���̐���
function makedropdown(page,range,row,col){
  var list = page.getRange(2,1,getLastRows(page,1),1);
  //for(var i=0; i<=getLastRows(page,1); i++) list.push(page.getRange(2+i,1).getValue());
  var modulerule= SpreadsheetApp
�@�@�@�@�@�@�@�@�@�@�@.newDataValidation()
�@�@�@�@�@�@�@�@�@�@�@.requireValueInList(list, true)
�@�@�@�@�@�@�@�@�@�@�@.build();
  range.offset(row, col).setDataValidation(modulerule); 
}

//���W���[���f�[�^�̎擾
function getdropdownmoduledata(target){
  var module = moduledata.getRange(2,1);
  for(var i=0; i<=getLastRows(moduledata,1); i++){
    if(target==module.offset(i,0).getValue()){
      url += "module="+module.offset(i, 1).getValue()+"&token="+module.offset(i, 2).getValue();
    }
  }
}
