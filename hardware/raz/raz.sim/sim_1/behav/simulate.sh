#!/bin/bash -f
xv_path="/home/shahriar/Xilinx/Vivado/2015.4"
ExecStep()
{
"$@"
RETVAL=$?
if [ $RETVAL -ne 0 ]
then
exit $RETVAL
fi
}
ExecStep $xv_path/bin/xsim dec512_behav -key {Behavioral:sim_1:Functional:dec512} -tclbatch dec512.tcl -log simulate.log
