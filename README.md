# iPixelLedBoard-MQTT-Homeassistant
## _Control the iPixel ledboard from MQTT and Homeassistant_
## _THis is NOT my code ! Special thanks to https://github.com/opa-gamert_
Intial project done by https://github.com/lucagoc/pypixelcolor




[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

[![iPixel board](https://github.com/freijn/iPixel-MQTT-Homeassistant/blob/main/pictures/ipixel.jpeg)

iPixel is a led board from china (sold by Action) and originally controlled/programmed by an app on you phone.
As always you connect your phone via Bluetooht to the board. 
In the app all kinds of text tricks can be programmed.

Opa-gamert has created a ESP32 to BlueTooht connect to the iPixel board and accept MQTT commands
over wifi to sent text to the display.

## Features

- Send MQTT commands to the display from Wifi to BlueTooht.
- Have the ESP32 formatting the messages and even split is msg if too long for the protocol.
- ESP32 does the keep alive over BlueTooht.
- colours , speed , animation can be selected.


## please Note
> This is NOT my code, but I like to share (and have permission) to share this working version to others 
> hence this git.

## Tech

Required for this project:

- [pixel] - Of course the iPixel led board! (including the powersupply)
- [esp32] - an ESP32, i used the ESP32-C3 Development Board ESP32 SuperMini Development Board
- [mqtt] - MQTT server, could be as an integration in Homeassistant
- [homeassistant] - Homeassistant itself

```sh
!! And of course configuration knowledge of !!
 - Homeassistant
 - MQTT
 - ESPhome, yaml
```
## Installation

- Open your Studio Code server and find the folder 'esphome'.
- Create the 'ipixel-esphome' folder.
- Past all files found in esphome/ipixel-esphome to it.

```sh
└── esphome/ipixel-esphome
    └── folder
    └── Font.h
    └── autodiscovery.yaml
    └── globals.yaml
    └── interval_keepalive.yaml
    └── ipixel-esphome.yaml
    └── ipixel_ble_writer.h
    └── ipixel_text.h
    └── ipixel_text_v2.h
    └── mqtt_ble.yaml
    └── mqtt_brightness.yaml
    └── mqtt_clock.yaml
    └── mqtt_clock_sync.yaml
    └── mqtt_png.yaml
    └── mqtt_power.yaml
    └── mqtt_text.yaml
    └── oscripts.yaml

```

- update your secrets.yaml as per template from 'esphomeYaml/secrets.yaml'
   worth nothing to mention you must change the info according to your local environement.
   The iPixel Bluetooth mac address can be found in your mobile phone after a successfull connection

Past the ipixel-matrix-card.js found in 
iPixel-MQTT-Homeassistant/www/ folder in the Homeassistant www folder.
Then goto settings >> 
 - dashboards
 - click on the three dots on the top right
 - resources
 - select 'add new resource' bottom right
 - select javascript module and fill in url : /local/ipixel-matrix-card.js
 - save 
 - Now do a ctrl+F5 for a browser refresh and see the card in the dashboard as last entry.



 ![Card screenshot](https://github.com/freijn/iPixel-MQTT-Homeassistant/blob/main/pictures/ipixelcard.JPG)



## Please Note 
  If the Ipixel has shown the lock/Bluetooth connected sign {-} the display will NOT connect
  to an other bluetooth device. You have to cycle power of the display in order to connect
  to an other bluetooth device.
  Sent the connect command found on the ESP32 ( the blue connect sign must be shown in the display)


## All set now !!  
## Do not forget :
> Recylce power on the display in order to connect to a different device.
  Sent the connect command found on the ESP32 ( the blue connect sign must show in the display)


## License


MIT

**Free Software, Hell Yeah!**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)
   [pixel]: <https://www.youtube.com/watch?v=h8wiWCxFuNI>
   [esp32]: <https://www.espboards.dev/esp32/esp32-c3-super-mini/>
   [mqtt]: <https://www.home-assistant.io/integrations/mqtt/>
   [homeassistant]: <http://https://www.home-assistant.io/>
   [MQTT]: <https://www.home-assistant.io/integrations/mqtt/>
   
   [markdown-it]: <https://t>
   [Ace Editor]: <http://ace.ajax.org>
   [node.js]: <http://nodejs.org>
   [Twitter Bootstrap]: <http://twitter.github.com/bootstrap/>
   [jQuery]: <http://jquery.com>
   [@tjholowaychuk]: <http://twitter.com/tjholowaychuk>
   [express]: <http://expressjs.com>
   [AngularJS]: <http://angularjs.org>
   [Gulp]: <http://gulpjs.com>

   [PlDb]: <https://github.com/joemccann/dillinger/tree/master/plugins/dropbox/README.md>
   [PlGh]: <https://github.com/joemccann/dillinger/tree/master/plugins/github/README.md>
   [PlGd]: <https://github.com/joemccann/dillinger/tree/master/plugins/googledrive/README.md>
   [PlOd]: <https://github.com/joemccann/dillinger/tree/master/plugins/onedrive/README.md>
   [PlMe]: <https://github.com/joemccann/dillinger/tree/master/plugins/medium/README.md>
   [PlGa]: <https://github.com/RahulHP/dillinger/blob/master/plugins/googleanalytics/README.md>

