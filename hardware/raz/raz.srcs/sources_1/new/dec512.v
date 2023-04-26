`timescale 1ns / 1ps
//////////////////////////////////////////////////////////////////////////////////
// Company: 
// Engineer: 
// 
// Create Date:    09:48:47 02/18/2018 
// Design Name: 
// Module Name:    dec512 
// Project Name: 
// Target Devices: 
// Tool versions: 
// Description: 
//
// Dependencies: 
//
// Revision: 
// Revision 0.01 - File Created
// Additional Comments: 
//
//////////////////////////////////////////////////////////////////////////////////
`define q 256 
`define log_q 8
`define n 512
`define nq 4096 //N * LOG Q
module dec512(	input [`n-1:0]r2, 
						input [`nq-1:0]c1, 
						input [`nq-1:0]c2, 
						input ack,
						input clk, 
						input rst, 
						output reg [`n-1:0]m, 
						output reg Valid	
						);

	reg [`log_q-1:0]in1[`n-1:0];
	reg [`log_q-1:0]in2[`n-1:0];
	reg [`log_q-1:0]out1[`n-1:0];
	reg [`log_q-1:0]w1[`n-1:0];
	reg [`log_q-1:0]w2;
	wire [`log_q-1:0]w3;

	
	reg [`log_q-1:0]res[`n-1:0];
	reg [1:0] state, next_state;
	reg [`log_q-1:0] counter;
	reg sel;
	reg [`n-1:0] r2_temp;
	
	
	
	parameter wait_dec 		= 2'b00;
	parameter dec_mul 		= 2'b01;
	parameter dec_add 		= 2'b10;
	parameter decode 			= 2'b11;
	
	
	always @* begin: mux2
		integer i;
		for (i=0; i<`n; i=i+1) begin
			if(sel == 0)begin
				in1[i][0] = c2[i*`log_q]& r2_temp[`n-1];
				in1[i][1] = c2[i*`log_q + 1]& r2_temp[`n-1];
				in1[i][2] = c2[i*`log_q + 2]& r2_temp[`n-1];
				in1[i][3] = c2[i*`log_q + 3]& r2_temp[`n-1];
				in1[i][4] = c2[i*`log_q + 4]& r2_temp[`n-1];
				in1[i][5] = c2[i*`log_q + 5]& r2_temp[`n-1];
				in1[i][6] = c2[i*`log_q + 6]& r2_temp[`n-1];
				in1[i][7] = c2[i*`log_q + 7]& r2_temp[`n-1];
			end
			else begin
				in1[i][0] = c1[i*`log_q];
				in1[i][1] = c1[i*`log_q + 1];
				in1[i][2] = c1[i*`log_q + 2];
				in1[i][3] = c1[i*`log_q + 3];
				in1[i][4] = c1[i*`log_q + 4];
				in1[i][5] = c1[i*`log_q + 5];
				in1[i][6] = c1[i*`log_q + 6];
				in1[i][7] = c1[i*`log_q + 7];
			end
		end
	end


		
		

	always @* begin: xor_input
		integer i;
		for (i=1; i<`n; i=i+1)
			in2[i] = res[i-1];
	end



	always @* begin
		if (sel == 0) begin
			in2[0][0] = ~res[`n-1][0];
			in2[0][1] = ~res[`n-1][1];
			in2[0][2] = ~res[`n-1][2];
			in2[0][3] = ~res[`n-1][3];
			in2[0][4] = ~res[`n-1][4];
			in2[0][5] = ~res[`n-1][5];
			in2[0][6] = ~res[`n-1][6];
			in2[0][7] = ~res[`n-1][7];
			end
		else
			in2[0] = res[`n-1];
	end
	
	
	
	always @* begin
		if (sel ==0 )
				out1[0] = in1[0] - in2[0];
		else
				out1[0] = in1[`n-1] + in2[0];
	end

	always @* begin: adder
		integer i;
		for (i=1; i<`n; i=i+1)
			out1[i] = in1[i-1] + in2[i];
	end

	
	
	always @* begin: decode1
		integer i;
		m[`n-1] = res[0][7] ^ ~res[0][6];
		for (i=1; i<`n; i=i+1)
			m[i-1] = res[i][7] ^ ~res[i][6];
	end
	
				
	
	always @(posedge clk) begin : registering
		integer i;
		for(i=0; i<`n; i=i+1) begin
			if(rst || state == wait_dec)
				res[i][`log_q-1:0] = `log_q'b0;
			else if (state != decode) begin
				res[i][`log_q-1:0] = out1[i][`log_q-1:0];
			end
		end
		
	
		if (rst || state == wait_dec)begin
			counter = 8'b0;
			r2_temp = r2;
		end
		else begin
			counter = counter + 1;
			r2_temp[`n-1:1]= r2_temp[`n-2:0];
		end
	end
	
	
	
	always @(posedge clk) begin
		if(rst)
			state <= wait_dec;
		else
			state <= next_state;
	end
	
	
	
	always @* begin: FSM
		next_state = state;
		sel = 0;
		case(state)
			wait_dec: begin
				if(ack) begin
					next_state = dec_mul;
				end
				Valid = 0;
			end
			dec_mul: begin
				sel = 0;
				if(counter == 8'b11111111) begin /// STATIC LOG N
					next_state = dec_add;
				end
			end
			dec_add: begin
				sel = 1;
				next_state = decode;
				Valid = 0;
			end
			decode: begin
				Valid = 1;
				sel = 1;
				next_state = wait_dec;
			end
			
		endcase
	end

endmodule
