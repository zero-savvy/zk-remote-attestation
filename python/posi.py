import poseidon

def pos_instance():
    # poseidon_simple, t = poseidon.parameters.case_simple()

    # input_vec = [x for x in range(0, t)]
    # print("Input: ", input_vec)
    # poseidon_digest = poseidon_simple.run_hash(input_vec)
    # print("Output: ", hex(int(poseidon_digest)))

    security_level = 128
    input_rate = 3
    t_opt = 4
    full_round = 8
    partial_round = 56
    alpha = 5
    poseidon_pre_generated = poseidon.OptimizedPoseidon(poseidon.HashType.CONSTINPUTLEN, poseidon.parameters.prime_255, 
                                                    security_level, alpha, input_rate, t_opt,
                                                    full_round=full_round, partial_round=partial_round,
                                                    rc_list=poseidon.parameters.round_constants_neptune, 
                                                    mds_matrix=poseidon.parameters.matrix_neptune)
    
    return poseidon_pre_generated


if __name__ == "__main__":
    pos_instance()