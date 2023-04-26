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
ExecStep $xv_path/bin/xelab -wto 31b5416e2a7c48d3b6683e772b1f51e6 -m64 --debug typical --relax --mt 8 -L xil_defaultlib -L unisims_ver -L unimacro_ver -L secureip --snapshot dec512_behav xil_defaultlib.dec512 xil_defaultlib.glbl -log elaborate.log
