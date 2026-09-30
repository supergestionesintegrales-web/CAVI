const fs = require('fs');
const path = require('path');

// We have the raw points extracted from the KML provided by user:
const kmlText = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>CORRESPONSAL BBVA</name>
      <Placemark><name>OFICINA RIOHACHA</name><description>Carrera 6A # 10-61</description><Point><coordinates>-72.9085,11.5460,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA FONSECA</name><address>CALLE 13 # 15-57 Fonseca</address><Point><coordinates>-72.8485,10.8885,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA MAICAO</name><address>CARRERA 9 # 13-19 Maicao</address><Point><coordinates>-72.2405,11.3785,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA ALBANIA</name><description>CARRERA 12 CALLE 7 Y 8 AVENIDA FERROCARRIL</description><Point><coordinates>-72.5920,11.1615,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA BARRANCAS</name><address>CALLE 9 # 6-60 Barrancas</address><Point><coordinates>-72.7885,10.9575,0</coordinates></Point></Placemark>
    </Folder>
    <Folder>
      <name>Corresponsal Banco Agrario</name>
      <Placemark><name>OFICINA FONSECA</name><address>CALLE 13 # 19-57 Fonseca</address><Point><coordinates>-72.8510,10.8875,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA MAICAO</name><address>CALLE 12 # 9-12 Maicao</address><Point><coordinates>-72.2415,11.3780,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA SAN JUAN DEL CESAR</name><description>Calle 3 # 3-36</description><Point><coordinates>-73.0035,10.7680,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA MANAURE</name><address>CALLE 5 # 5 -121 Manaure</address><Point><coordinates>-72.4460,11.7750,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA URUMITA</name><address>Carrera 9 # 9 -04 Urumita</address><Point><coordinates>-73.0115,10.5595,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA RIOHACHA</name><address>Carrera 8a # 12A 83 riohacha</address><Point><coordinates>-72.9090,11.5440,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA VILLANUEVA</name><address>Carrera 16 # 29-08 Villanueva</address><Point><coordinates>-72.9810,10.6060,0</coordinates></Point></Placemark>
    </Folder>
    <Folder>
      <name>Corresponsal Bancamia</name>
      <Placemark><name>OFICINA FONSECA</name><address>Calle 13 # 14 - 75 Fonseca</address><Point><coordinates>-72.8475,10.8890,0</coordinates></Point></Placemark>
      <Placemark><name>OFICINA RIOHACHA</name><address>Calle 4 No. 8 - 11 riohacha</address><Point><coordinates>-72.9080,11.5490,0</coordinates></Point></Placemark>
    </Folder>
    <Folder>
      <name>GRUPO AVAL</name>
      <Placemark><name>Banco de Bogotá Riohacha</name><address>Cra. 9 #3 - 06 RIOHACHA</address><Point><coordinates>-72.9095,11.5495,0</coordinates></Point></Placemark>
      <Placemark><name>Banco de Bogota Oficina Viva Wajira</name><address>Cl. 15 #18 - 274 Riohacha</address><Point><coordinates>-72.9165,11.5415,0</coordinates></Point></Placemark>
      <Placemark><name>Banco de Occidente Riohacha</name><address>Cl. 3 #6 - 66 Riohacha</address><Point><coordinates>-72.9070,11.5498,0</coordinates></Point></Placemark>
      <Placemark><name>Banco AV Villas Riohacha</name><address>Cl. 4 #9 – 05 Riohacha</address><Point><coordinates>-72.9098,11.5488,0</coordinates></Point></Placemark>
      <Placemark><name>Banco Popular Riohacha</name><address>Cl. 1 #6 - 89 Riohacha</address><Point><coordinates>-72.9065,11.5510,0</coordinates></Point></Placemark>
    </Folder>
  </Document>
</kml>`;
console.log('Script initialized');
