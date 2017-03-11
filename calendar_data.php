<?php
//header("Access-Control-Allow-Origin: *");
//header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
//$data = file_get_contents("https://docs.google.com/spreadsheets/d/1OzVJdCNJT7EjVMwOPY026em473aTtb4gqB8Td_rxJF4/pub?gid=1227140642&single=true&output=csv");
$data = file_get_contents("spring_2017.csv");
$rows = explode("\r",$data);
$s = array();
foreach($rows as $row) {
$s[] = str_getcsv($row);
}
echo json_encode($s);

?>