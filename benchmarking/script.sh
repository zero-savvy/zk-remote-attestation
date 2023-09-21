#!/bin/bash

# Set the number of times to run the command
num_times="$1"

# Initialize total time variable
total_time=0

# Run the command multiple times
for (( i=1; i<=$num_times; i++ ))
do
    start_time=$(date +%s.%N)   # Start time in seconds
    # Replace the following line with your command
    # Example: command_to_run
    node "$2"/generate_witness.js "$2"/zRA.wasm "$2"/good_input.json "$2"/witness.wtns                     # Example command (sleep for 1 second)
    end_time=$(date +%s.%N)     # End time in seconds

    # Calculate the execution time
    execution_time=$(echo "$end_time - $start_time" | bc -l)
    total_time=$(echo "$total_time + $execution_time" | bc -l)
done

# Calculate the average execution time
average_time=$(echo "scale=4; $total_time / $num_times" | bc -l)

# Print the average execution time
echo "Average witness generation time: $average_time seconds"


# Initialize total time variable
total_time=0

# Run the command multiple times
for (( i=1; i<=$num_times; i++ ))
do
    start_time=$(date +%s.%N)   # Start time in seconds
    # Replace the following line with your command
    # Example: command_to_run
    snarkjs groth16 prove "$2"/zRA.zkey "$2"/witness.wtns "$2"/proof.json "$2"/public.json                     # Example command (sleep for 1 second)
    end_time=$(date +%s.%N)     # End time in seconds

    # Calculate the execution time
    execution_time=$(echo "$end_time - $start_time" | bc -l)
    total_time=$(echo "$total_time + $execution_time" | bc -l)
done

# Calculate the average execution time
average_time=$(echo "scale=4; $total_time / $num_times" | bc -l)

# Print the average execution time
echo "Average proof generation time: $average_time seconds"
