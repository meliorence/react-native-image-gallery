'use strict';

const VISCOUS_FLUID_SCALE = 8;
const VISCOUS_FLUID_NORMALIZE = 1 / viscousFluid(1);
const VISCOUS_FLUID_OFFSET = 1 - VISCOUS_FLUID_NORMALIZE * viscousFluid(1);

function viscousFluid (x) {
    x *= VISCOUS_FLUID_SCALE;
    if (x < 1) {
        x -= (1 - Math.exp(-x));
    } else {
        var start = 0.36787944117;   // 1/e == exp(-1)
        x = 1 - Math.exp(1 - x);
        x = start + x * (1 - start);
    }
    return x;
}

const ViscousFluidInterpolator = {
    getInterpolation: function (input) {
        var interpolated = VISCOUS_FLUID_NORMALIZE * viscousFluid(input);
        if (interpolated > 0) {
            return interpolated + VISCOUS_FLUID_OFFSET;
        }
        return interpolated;
    }
};

export default ViscousFluidInterpolator;
