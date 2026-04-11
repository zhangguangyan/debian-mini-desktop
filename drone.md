```
Options:
	--help|-h                display this help information
	--wipe|-w                wipe eeprom
	--unhide-groups|-u       parameter enumeration ignores AP_PARAM_FLAG_ENABLE
	--speedup|-s SPEEDUP     set simulation speedup
	--rate|-r RATE           set SITL framerate
	--console|-C             use console instead of TCP ports
	--instance|-I N          set instance of SITL (adds 10*instance to all port numbers)
	--synthetic-clock|-S     set synthetic clock mode
	--home|-O HOME           set start location (lat,lng,alt,yaw) or location name
	--model|-M MODEL         set simulation model
	--config string          set additional simulation config string
	--fg|-F ADDRESS          set Flight Gear view address, defaults to 127.0.0.1
	--enable-fgview          enable Flight Gear view
	--gimbal                 enable simulated MAVLink gimbal
	--autotest-dir DIR       set directory for additional files
	--defaults path          set path to defaults file
	--serial0 device         set device string for SERIAL0
	--serial1 device         set device string for SERIAL1
	--serial2 device         set device string for SERIAL2
	--serial3 device         set device string for SERIAL3
	--serial4 device         set device string for SERIAL4
	--serial5 device         set device string for SERIAL5
	--serial6 device         set device string for SERIAL6
	--serial7 device         set device string for SERIAL7
	--serial8 device         set device string for SERIAL8
	--serial9 device         set device string for SERIAL9
	--uartA device           alias for --serial0 (do not use)
	--rtscts                 enable rtscts on serial ports (default false)
	--base-port PORT         set port num for base port(default 5670) must be before -I option
	--rc-in-port PORT        set port num for rc in
	--sim-address ADDR       set address string for simulator
	--sim-port-in PORT       set port num for simulator in
	--sim-port-out PORT      set port num for simulator out
	--irlock-port PORT       set port num for irlock
	--start-time TIMESTR     set simulation start time in UNIX timestamp
	--sysid ID               set MAV_SYSID
	--slave number           set the number of JSON slaves


cd /workspaces/uav/ardupilot
build/sitl/bin/arducopter \
	--model + \
	--home -35.363261,149.165230,584,353 \
	--defaults Tools/autotest/default_params/copter.parm


  build/sitl/bin/arducopter \                                                                                                                    
      --model + \                                                                                                                                
      --speedup 1 \                                                                                                                              
      --enable-fgview \                                                                                                                          
      --defaults Tools/autotest/default_params/copter.parm \                                                                                     
      --sim-address=127.0.0.1 \                                                                                                                  
      -I0 \                                                                                                                                      
      --home 37.619373,-122.376637,5.3,118

build/sitl/bin/arducopter \
	--model + \
	--defaults Tools/autotest/default_params/copter.parm \
	--home -35.363261,149.165230,584,353


build/sitl/bin/arducopter \
	--model + \
	--defaults Tools/autotest/default_params/copter.parm \
	--enable-fgview \
	--fg host.docker.internal \
	--home 37.619373,-122.376637,5.3,118

build/sitl/bin/arducopter \                                                                                                                    
	--model + \                                                                                                                                
	--enable-fgview \
	--fg 192.168.65.254 \                                                                                                                      
	--defaults Tools/autotest/default_params/copter.parm \                                                                                     
	--home KSFO
```
