---
title: 'Testing Tinygrad Model Export'
date: 2024-06-30T18:25:54-07:00
draft: true
---

I've worked with [tinygrad](https://tinygrad.org/) at multiple points over the past couple of years. It's a very cool tensor library with autograd features and support for a variety of backends, and I appreciate how it makes me feel in control of the code that's running on my GPU rather than pushing buttons on the outside of a black box wrapped with 800k lines of C++.

One thing I wanted to try out with it was model export. Tinygrad has some ability to generate standalone code to run models outside of Python which I was interested in using.

The code for that is in `extra/export_model.py`. I had to manually adjust my Python path in order to import it from my code:

```py
sys.path.append(os.path.expanduser("~/tinygrad"))
```

My original plan was to use the WebGPU or WebGL backends which I'd heard were supported by Tinygrad for export. There were dedicated codepaths devoted to each of them in the `export_model.py` file anyway.

However, when I looked into it further, it seems that support for these backends is no longer maintained and that code is retained for reference only: https://github.com/tinygrad/tinygrad/issues/3479#issuecomment-1959596523

This made me a bit worried since the `export_model.py` which I was planning on using was also in the /extra directory, making me think that it wasn't officially supported. Nevertheless, I decided to keep going and see how far I could get.

I ran into a variety of issues getting the model to compile. When I called the `export_model` function, I'd get errors like "didn't JIT anything!" if I ran the export after the model had been trained. Not a lot of point in exporting a model before it's been trained, so I had to figure it out.

For the "didn't JIT anyting!" error, I figured out that cloning all of the weight and bias tensors from my model was enough to get that part fixed. I basically constructed a clone of the model with duplicated tensors like this:

```py
for layer_ix in range(len(model.layers)):
    clone_model.layers[layer_ix].weights = Tensor(model.layers[layer_ix].numpy())
```

That exposed a new error that came from an assertion inside Tinygrad. To resolve that, I had to add this code after training the model and before constructing the clone and exporting it:

```py
Device.DEFAULT = "CLANG"
```

Since I wasn't using the slow single-threaded clang backend which runs on the CPU to train, I had to manually swap out the backend so that the generated code lined up with what was needed to export the model.

A ton of trial and error later, I finally got a single .c file exported which contained all of the model's weight and bias tensors inlined as huge constants as well as a final `void net(...)` function to run it.

I was able to compile it with gcc and even run it by attaching a simple `main` function to the program which calls `net` with some dummy data.

When I looked into the generated code, though, I was a bit dissapointed with what I saw. For example, here's one of the functions that was generated for some kernel that I think is a fused matrix multiply + tanh activation for a layer:

```c
void r_256_4_4_3_25(float* restrict data0, const float* restrict data1, const float* restrict data2, const float* restrict data3) {
  for (int ridx0 = 0; ridx0 < 256; ridx0++) {
    int alu0 = (ridx0*100);
    float val0 = data1[alu0+1];
    float val1 = data1[alu0+2];
    float val2 = data1[alu0+3];
    float val3 = data1[alu0+4];
    float val4 = data1[alu0+5];
    float val5 = data1[alu0+6];
    float val6 = data1[alu0+7];
    float val7 = data1[alu0+8];
    float val8 = data1[alu0+9];
    float val9 = data1[alu0+10];
    float val10 = data1[alu0+11];
    float val11 = data1[alu0+12];
    float val12 = data1[alu0+13];
    float val13 = data1[alu0+14];
    float val14 = data1[alu0+15];
    float val15 = data1[alu0+16];
    float val16 = data1[alu0+17];
    float val17 = data1[alu0+18];
    float val18 = data1[alu0+19];
    float val19 = data1[alu0+20];
    float val20 = data1[alu0+21];
    float val21 = data1[alu0+22];
    float val22 = data1[alu0+23];
    float val23 = data1[alu0+24];
    float val24 = data1[alu0+25];
    float val25 = data1[alu0+26];
    float val26 = data1[alu0+27];
    float val27 = data1[alu0+28];
    float val28 = data1[alu0+29];
    float val29 = data1[alu0+30];
    float val30 = data1[alu0+31];
    float val31 = data1[alu0+32];
    float val32 = data1[alu0+33];
    float val33 = data1[alu0+34];
    float val34 = data1[alu0+35];
    float val35 = data1[alu0+36];
    float val36 = data1[alu0+37];
    float val37 = data1[alu0+38];
    float val38 = data1[alu0+39];
    float val39 = data1[alu0+40];
    float val40 = data1[alu0+41];
    float val41 = data1[alu0+42];
    float val42 = data1[alu0+43];
    float val43 = data1[alu0+44];
    float val44 = data1[alu0+45];
    float val45 = data1[alu0+46];
    float val46 = data1[alu0+47];
    float val47 = data1[alu0+48];
    float val48 = data1[alu0+49];
    float val49 = data1[alu0+50];
    float val50 = data1[alu0+51];
    float val51 = data1[alu0+52];
    float val52 = data1[alu0+53];
    float val53 = data1[alu0+54];
    float val54 = data1[alu0+55];
    float val55 = data1[alu0+56];
    float val56 = data1[alu0+57];
    float val57 = data1[alu0+58];
    float val58 = data1[alu0+59];
    float val59 = data1[alu0+60];
    float val60 = data1[alu0+61];
    float val61 = data1[alu0+62];
    float val62 = data1[alu0+63];
    float val63 = data1[alu0+64];
    float val64 = data1[alu0+65];
    float val65 = data1[alu0+66];
    float val66 = data1[alu0+67];
    float val67 = data1[alu0+68];
    float val68 = data1[alu0+69];
    float val69 = data1[alu0+70];
    float val70 = data1[alu0+71];
    float val71 = data1[alu0+72];
    float val72 = data1[alu0+73];
    float val73 = data1[alu0+74];
    float val74 = data1[alu0+75];
    float val75 = data1[alu0+76];
    float val76 = data1[alu0+77];
    float val77 = data1[alu0+78];
    float val78 = data1[alu0+79];
    float val79 = data1[alu0+80];
    float val80 = data1[alu0+81];
    float val81 = data1[alu0+82];
    float val82 = data1[alu0+83];
    float val83 = data1[alu0+84];
    float val84 = data1[alu0+85];
    float val85 = data1[alu0+86];
    float val86 = data1[alu0+87];
    float val87 = data1[alu0+88];
    float val88 = data1[alu0+89];
    float val89 = data1[alu0+90];
    float val90 = data1[alu0+91];
    float val91 = data1[alu0+92];
    float val92 = data1[alu0+93];
    float val93 = data1[alu0+94];
    float val94 = data1[alu0+95];
    float val95 = data1[alu0+96];
    float val96 = data1[alu0+97];
    float val97 = data1[alu0+98];
    float val98 = data1[alu0+99];
    float val99 = data1[alu0];
    for (int ridx1 = 0; ridx1 < 4; ridx1++) {
      int alu1 = (ridx1*3);
      int alu2 = ((ridx0*48)+alu1);
      int alu3 = (ridx1*75);
      float val100 = data2[alu3+1];
      float val101 = data2[alu3+2];
      float val102 = data2[alu3+3];
      float val103 = data2[alu3+4];
      float val104 = data2[alu3+5];
      float val105 = data2[alu3+6];
      float val106 = data2[alu3+7];
      float val107 = data2[alu3+8];
      float val108 = data2[alu3+9];
      float val109 = data2[alu3+10];
      float val110 = data2[alu3+11];
      float val111 = data2[alu3+12];
      float val112 = data2[alu3+13];
      float val113 = data2[alu3+14];
      float val114 = data2[alu3+15];
      float val115 = data2[alu3+16];
      float val116 = data2[alu3+17];
      float val117 = data2[alu3+18];
      float val118 = data2[alu3+19];
      float val119 = data2[alu3+20];
      float val120 = data2[alu3+21];
      float val121 = data2[alu3+22];
      float val122 = data2[alu3+23];
      float val123 = data2[alu3+24];
      float val124 = data2[alu3+25];
      float val125 = data2[alu3+26];
      float val126 = data2[alu3+27];
      float val127 = data2[alu3+28];
      float val128 = data2[alu3+29];
      float val129 = data2[alu3+30];
      float val130 = data2[alu3+31];
      float val131 = data2[alu3+32];
      float val132 = data2[alu3+33];
      float val133 = data2[alu3+34];
      float val134 = data2[alu3+35];
      float val135 = data2[alu3+36];
      float val136 = data2[alu3+37];
      float val137 = data2[alu3+38];
      float val138 = data2[alu3+39];
      float val139 = data2[alu3+40];
      float val140 = data2[alu3+41];
      float val141 = data2[alu3+42];
      float val142 = data2[alu3+43];
      float val143 = data2[alu3+44];
      float val144 = data2[alu3+45];
      float val145 = data2[alu3+46];
      float val146 = data2[alu3+47];
      float val147 = data2[alu3+48];
      float val148 = data2[alu3+49];
      float val149 = data2[alu3+50];
      float val150 = data2[alu3+51];
      float val151 = data2[alu3+52];
      float val152 = data2[alu3+53];
      float val153 = data2[alu3+54];
      float val154 = data2[alu3+55];
      float val155 = data2[alu3+56];
      float val156 = data2[alu3+57];
      float val157 = data2[alu3+58];
      float val158 = data2[alu3+59];
      float val159 = data2[alu3+60];
      float val160 = data2[alu3+61];
      float val161 = data2[alu3+62];
      float val162 = data2[alu3+63];
      float val163 = data2[alu3+64];
      float val164 = data2[alu3+65];
      float val165 = data2[alu3+66];
      float val166 = data2[alu3+67];
      float val167 = data2[alu3+68];
      float val168 = data2[alu3+69];
      float val169 = data2[alu3+70];
      float val170 = data2[alu3+71];
      float val171 = data2[alu3+72];
      float val172 = data2[alu3+73];
      float val173 = data2[alu3+74];
      float val174 = data2[alu3];
      float val175 = data3[alu1+1];
      data0[alu2+1] = ((2.0f*(1/(1.0f+exp2((((val23*val148)+(val22*val147)+(val21*val146)+(val20*val145)+(val19*val144)+(val18*val143)+(val17*val142)+(val16*val141)+(val15*val140)+(val14*val139)+(val13*val138)+(val12*val137)+(val11*val136)+(val10*val135)+(val9*val134)+(val8*val133)+(val7*val132)+(val6*val131)+(val5*val130)+(val4*val129)+(val3*val128)+(val2*val127)+(val1*val126)+(val0*val125)+(val99*val124)+val175)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+13] = ((2.0f*(1/(1.0f+exp2((((val48*val148)+(val47*val147)+(val46*val146)+(val45*val145)+(val44*val144)+(val43*val143)+(val42*val142)+(val41*val141)+(val40*val140)+(val39*val139)+(val38*val138)+(val37*val137)+(val36*val136)+(val35*val135)+(val34*val134)+(val33*val133)+(val32*val132)+(val31*val131)+(val30*val130)+(val29*val129)+(val28*val128)+(val27*val127)+(val26*val126)+(val25*val125)+(val24*val124)+val175)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+25] = ((2.0f*(1/(1.0f+exp2((((val73*val148)+(val72*val147)+(val71*val146)+(val70*val145)+(val69*val144)+(val68*val143)+(val67*val142)+(val66*val141)+(val65*val140)+(val64*val139)+(val63*val138)+(val62*val137)+(val61*val136)+(val60*val135)+(val59*val134)+(val58*val133)+(val57*val132)+(val56*val131)+(val55*val130)+(val54*val129)+(val53*val128)+(val52*val127)+(val51*val126)+(val50*val125)+(val49*val124)+val175)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+37] = ((2.0f*(1/(1.0f+exp2((((val98*val148)+(val97*val147)+(val96*val146)+(val95*val145)+(val94*val144)+(val93*val143)+(val92*val142)+(val91*val141)+(val90*val140)+(val89*val139)+(val88*val138)+(val87*val137)+(val86*val136)+(val85*val135)+(val84*val134)+(val83*val133)+(val82*val132)+(val81*val131)+(val80*val130)+(val79*val129)+(val78*val128)+(val77*val127)+(val76*val126)+(val75*val125)+(val74*val124)+val175)*(-2.885390043258667f))))))+(-1.0f));
      float val176 = data3[alu1+2];
      data0[alu2+2] = ((2.0f*(1/(1.0f+exp2((((val23*val173)+(val22*val172)+(val21*val171)+(val20*val170)+(val19*val169)+(val18*val168)+(val17*val167)+(val16*val166)+(val15*val165)+(val14*val164)+(val13*val163)+(val12*val162)+(val11*val161)+(val10*val160)+(val9*val159)+(val8*val158)+(val7*val157)+(val6*val156)+(val5*val155)+(val4*val154)+(val3*val153)+(val2*val152)+(val1*val151)+(val0*val150)+(val99*val149)+val176)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+14] = ((2.0f*(1/(1.0f+exp2((((val48*val173)+(val47*val172)+(val46*val171)+(val45*val170)+(val44*val169)+(val43*val168)+(val42*val167)+(val41*val166)+(val40*val165)+(val39*val164)+(val38*val163)+(val37*val162)+(val36*val161)+(val35*val160)+(val34*val159)+(val33*val158)+(val32*val157)+(val31*val156)+(val30*val155)+(val29*val154)+(val28*val153)+(val27*val152)+(val26*val151)+(val25*val150)+(val24*val149)+val176)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+26] = ((2.0f*(1/(1.0f+exp2((((val73*val173)+(val72*val172)+(val71*val171)+(val70*val170)+(val69*val169)+(val68*val168)+(val67*val167)+(val66*val166)+(val65*val165)+(val64*val164)+(val63*val163)+(val62*val162)+(val61*val161)+(val60*val160)+(val59*val159)+(val58*val158)+(val57*val157)+(val56*val156)+(val55*val155)+(val54*val154)+(val53*val153)+(val52*val152)+(val51*val151)+(val50*val150)+(val49*val149)+val176)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+38] = ((2.0f*(1/(1.0f+exp2((((val98*val173)+(val97*val172)+(val96*val171)+(val95*val170)+(val94*val169)+(val93*val168)+(val92*val167)+(val91*val166)+(val90*val165)+(val89*val164)+(val88*val163)+(val87*val162)+(val86*val161)+(val85*val160)+(val84*val159)+(val83*val158)+(val82*val157)+(val81*val156)+(val80*val155)+(val79*val154)+(val78*val153)+(val77*val152)+(val76*val151)+(val75*val150)+(val74*val149)+val176)*(-2.885390043258667f))))))+(-1.0f));
      float val177 = data3[alu1];
      data0[alu2+12] = ((2.0f*(1/(1.0f+exp2((((val48*val123)+(val47*val122)+(val46*val121)+(val45*val120)+(val44*val119)+(val43*val118)+(val42*val117)+(val41*val116)+(val40*val115)+(val39*val114)+(val38*val113)+(val37*val112)+(val36*val111)+(val35*val110)+(val34*val109)+(val33*val108)+(val32*val107)+(val31*val106)+(val30*val105)+(val29*val104)+(val28*val103)+(val27*val102)+(val26*val101)+(val25*val100)+(val24*val174)+val177)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+24] = ((2.0f*(1/(1.0f+exp2((((val73*val123)+(val72*val122)+(val71*val121)+(val70*val120)+(val69*val119)+(val68*val118)+(val67*val117)+(val66*val116)+(val65*val115)+(val64*val114)+(val63*val113)+(val62*val112)+(val61*val111)+(val60*val110)+(val59*val109)+(val58*val108)+(val57*val107)+(val56*val106)+(val55*val105)+(val54*val104)+(val53*val103)+(val52*val102)+(val51*val101)+(val50*val100)+(val49*val174)+val177)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2+36] = ((2.0f*(1/(1.0f+exp2((((val98*val123)+(val97*val122)+(val96*val121)+(val95*val120)+(val94*val119)+(val93*val118)+(val92*val117)+(val91*val116)+(val90*val115)+(val89*val114)+(val88*val113)+(val87*val112)+(val86*val111)+(val85*val110)+(val84*val109)+(val83*val108)+(val82*val107)+(val81*val106)+(val80*val105)+(val79*val104)+(val78*val103)+(val77*val102)+(val76*val101)+(val75*val100)+(val74*val174)+val177)*(-2.885390043258667f))))))+(-1.0f));
      data0[alu2] = ((2.0f*(1/(1.0f+exp2((((val23*val123)+(val22*val122)+(val21*val121)+(val20*val120)+(val19*val119)+(val18*val118)+(val17*val117)+(val16*val116)+(val15*val115)+(val14*val114)+(val13*val113)+(val12*val112)+(val11*val111)+(val10*val110)+(val9*val109)+(val8*val108)+(val7*val107)+(val6*val106)+(val5*val105)+(val4*val104)+(val3*val103)+(val2*val102)+(val1*val101)+(val0*val100)+(val99*val174)+val177)*(-2.885390043258667f))))))+(-1.0f));
    }
  }
}
```

The first thing you'll note is the code that creates like 150 locals on the stack with data read in from the provided buffers. There's no functional problem with this code - it runs just fine and produces correct output - but the assembly it compiles into is quite bad and looks like this:

```asm
.LCPI0_0:
        .long   0xc038aa3b                      # float -2.88539004
.LCPI0_1:
        .long   0x3f800000                      # float 1
.LCPI0_2:
        .long   0x40000000                      # float 2
r_256_2_4_6:                            # @r_256_2_4_6
        push    r15
        push    r14
        push    rbx
        sub     rsp, 352
        vmovss  xmm1, dword ptr [rdx + 8]       # xmm1 = mem[0],zero,zero,zero
        vmovss  xmm2, dword ptr [rdx + 4]       # xmm2 = mem[0],zero,zero,zero
        vmovss  xmm0, dword ptr [rdx]           # xmm0 = mem[0],zero,zero,zero
        vmovss  xmm3, dword ptr [rdx + 24]      # xmm3 = mem[0],zero,zero,zero
        mov     rbx, rsi
        mov     r14, rdi
        xor     r15d, r15d
        add     rbx, 92
        vmovss  dword ptr [rsp + 48], xmm1      # 4-byte Spill
        vmovss  xmm1, dword ptr [rdx + 16]      # xmm1 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 52], xmm2      # 4-byte Spill
        vmovss  xmm2, dword ptr [rdx + 12]      # xmm2 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 56], xmm0      # 4-byte Spill
        vmovss  dword ptr [rsp + 4], xmm3       # 4-byte Spill
        vmovss  dword ptr [rsp + 40], xmm1      # 4-byte Spill
        vmovss  xmm1, dword ptr [rcx]           # xmm1 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 44], xmm2      # 4-byte Spill
        vmovss  xmm2, dword ptr [rdx + 20]      # xmm2 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 32], xmm1      # 4-byte Spill
        vmovss  xmm1, dword ptr [rdx + 28]      # xmm1 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 36], xmm2      # 4-byte Spill
        vmovss  xmm2, dword ptr [rcx + 4]       # xmm2 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 24], xmm1      # 4-byte Spill
        vmovss  xmm1, dword ptr [rdx + 36]      # xmm1 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 28], xmm2      # 4-byte Spill
        vmovss  xmm2, dword ptr [rdx + 32]      # xmm2 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 16], xmm1      # 4-byte Spill
        vmovss  xmm1, dword ptr [rdx + 44]      # xmm1 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 20], xmm2      # 4-byte Spill
        vmovss  xmm2, dword ptr [rdx + 40]      # xmm2 = mem[0],zero,zero,zero
        vmovss  dword ptr [rsp + 8], xmm1       # 4-byte Spill
        # ...
```

There are dozens (hundreds?) more lines like this. Note the comments that say "4-byte Spill". These mean that there's no space in registers for all of those locals, so they're being spilled onto the stack.

So this code spends a bunch of time manually copying data out of buffers and onto the stack, then performs a bunch of matrix multiplications + tanh on it, and then writes it back into the output buffers.

What I'm getting it is the fact that this code isn't at all optimal. I did compile this with ` -O3 -march=native` as well, but the optimizer isn't able to fix this huge amount of useless copying.

## Conclusion

So yeah, after seeing this I pretty much gave up on using Tinygrad's export feature for my use case. My model is pretty simple, so I'll probably end up just writing a ported model from scratch in Rust or WebGL if I really need it to run on the GPU.

Tinygrad didn't really go out of their way to advertise the existence of this code export feature, so I'll go with the original assumption that it's provided for reference and I was lucky to get it working at all.
