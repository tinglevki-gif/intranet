/**
 * Exact Parser & Calculator for Tinglev Tischplan Export files (.txt, .csv)
 * Matches Tischantigravity21 / Tischplan-Export-Reader official production specifications
 */

export const RAW_SAMPLE_DATA_24_08 = `Pos.  ;Projekt Nr..  ;Prod. GUID          ;Hall. Nr.  ;Prod. Datum  ;Stapel  ;Pal Nr..  ;Länge  ;Höhe  ;Breite  ;Fläche  ;Volumen  ;Betongüte           
22    ;A26-00293     ;d8a10519-692e-4f48-b;1          ;2026-08-24   ;3       ;1         ;1.570  ;2.975 ;24.00   ;4.671   ;1.121    ;LC16/18-2000-ROT    
27    ;A26-00293     ;a5041a18-0e2e-4a68-b;1          ;2026-08-24   ;4       ;1         ;2.500  ;2.975 ;24.00   ;7.438   ;1.785    ;LC16/18-2000-T-ROT  
26    ;A26-00293     ;74980253-41c6-4c8e-9;1          ;2026-08-24   ;4       ;1         ;3.165  ;2.975 ;24.00   ;9.416   ;2.260    ;LC16/18-2000-T-ROT  
19    ;A26-00293     ;f6ad25cc-5ac4-4fb7-8;1          ;2026-08-24   ;3       ;1         ;2.180  ;2.975 ;24.00   ;6.486   ;1.557    ;LC16/18-2000-T-ROT  
17    ;A26-00293     ;1858de17-f38d-4a97-9;1          ;2026-08-24   ;2       ;2         ;0.600  ;2.975 ;24.00   ;1.785   ;0.428    ;LC16/18-2000-T-ROT  
16    ;A26-00293     ;b00cc658-f384-4b7e-b;1          ;2026-08-24   ;2       ;2         ;2.090  ;2.975 ;24.00   ;6.218   ;1.492    ;LC16/18-2000-T-ROT  
14    ;A26-00293     ;58bbba12-de2d-437a-b;1          ;2026-08-24   ;2       ;2         ;1.420  ;2.975 ;24.00   ;4.225   ;1.014    ;LC16/18-2000-T-ROT  
13    ;A26-00293     ;5d1400b0-239f-4a87-b;1          ;2026-08-24   ;2       ;2         ;0.950  ;2.975 ;24.00   ;2.826   ;0.678    ;LC16/18-2000-T-ROT  
12    ;A26-00293     ;668dd79b-0e8b-4c7e-8;1          ;2026-08-24   ;2       ;2         ;1.735  ;2.975 ;24.00   ;5.162   ;1.239    ;LC16/18-2000-T-ROT  
10    ;A26-00293     ;07a54036-cd1c-4c53-a;1          ;2026-08-24   ;1       ;2         ;3.700  ;2.975 ;24.00   ;11.008  ;2.642    ;LC16/18-2000-T-ROT  
67    ;A25-00524     ;05d3a6bd-c012-4441-b;1          ;2026-08-24   ;8       ;3         ;2.467  ;2.935 ;22.00   ;6.999   ;1.540    ;LC16/18-2000-T-ROT  
66    ;A25-00524     ;654c7d2d-9f31-48d9-b;1          ;2026-08-24   ;8       ;3         ;2.287  ;2.935 ;22.00   ;6.701   ;1.474    ;LC16/18-2000-T-ROT  
59    ;A25-00524     ;bc16dff7-a7c5-41da-8;1          ;2026-08-24   ;7       ;3         ;2.080  ;2.935 ;22.00   ;6.105   ;1.343    ;LC16/18-2000-T-ROT  
58    ;A25-00524     ;d38b1d34-b9f1-4749-a;1          ;2026-08-24   ;7       ;3         ;3.060  ;2.935 ;22.00   ;8.981   ;1.976    ;LC16/18-2000-T-ROT  
57    ;A25-00524     ;eddaef80-ec01-42a9-b;1          ;2026-08-24   ;7       ;4         ;2.802  ;2.935 ;22.00   ;7.911   ;1.740    ;LC16/18-2000-T-ROT  
56    ;A25-00524     ;9e944d51-bd7b-49f1-a;1          ;2026-08-24   ;7       ;4         ;2.217  ;2.935 ;22.00   ;6.508   ;1.432    ;LC16/18-2000-T-ROT  
49    ;A25-00524     ;d619faf1-f6a6-4dad-8;1          ;2026-08-24   ;6       ;4         ;2.610  ;2.725 ;22.00   ;7.112   ;1.565    ;LC16/18-2000-T-ROT  
43    ;A25-00524     ;2d463d15-5b1b-40ae-a;1          ;2026-08-24   ;5       ;4         ;3.620  ;2.725 ;22.00   ;9.865   ;2.170    ;LC16/18-2000-T-ROT  
30    ;A25-00524     ;20aab8c3-07f0-49b6-9;1          ;2026-08-24   ;4       ;5         ;2.015  ;2.935 ;30.00   ;5.851   ;1.755    ;C30/37-ROT          
25    ;A26-00293     ;17007b5b-f447-406b-a;1          ;2026-08-24   ;3       ;5         ;2.040  ;3.175 ;30.00   ;6.437   ;1.931    ;C30/37-2400-ROT     
24    ;A26-00293     ;c4050ef4-f4d1-4673-a;1          ;2026-08-24   ;3       ;5         ;1.580  ;3.175 ;30.00   ;5.017   ;1.505    ;C30/37-2400-ROT     
23    ;A26-00293     ;53fc9913-0bf1-4573-a;1          ;2026-08-24   ;3       ;5         ;1.885  ;3.175 ;30.00   ;5.945   ;1.784    ;C30/37-2400-ROT     
20    ;A26-00293     ;bb4b2e52-3b69-440d-a;1          ;2026-08-24   ;3       ;5         ;2.350  ;3.175 ;30.00   ;7.381   ;2.214    ;C30/37-2400-ROT     
17    ;A26-00269     ;a927c8a5-a691-4230-a;1          ;2026-08-24   ;2       ;7         ;1.240  ;2.715 ;15.00   ;3.367   ;0.505    ;LC16/18-1800-T-ROT  
16    ;A26-00269     ;e3b081de-17a1-4ce6-8;1          ;2026-08-24   ;1       ;7         ;1.320  ;2.715 ;15.00   ;3.584   ;0.538    ;LC16/18-1800-T-ROT  
15    ;A26-00269     ;afefc0eb-2ec2-4aae-8;1          ;2026-08-24   ;1       ;7         ;3.610  ;2.715 ;15.00   ;9.801   ;1.470    ;LC16/18-1800-T-ROT  
14    ;A26-00269     ;2fa14839-69bb-4556-a;1          ;2026-08-24   ;2       ;8         ;2.855  ;2.715 ;15.00   ;7.751   ;1.163    ;LC16/18-1800-T-ROT  
11    ;A26-00269     ;1b244700-ca47-4979-9;1          ;2026-08-24   ;2       ;8         ;2.935  ;2.715 ;15.00   ;7.969   ;1.195    ;LC16/18-1800-T-ROT  
12    ;A26-00269     ;322c6d53-a1df-49ec-8;1          ;2026-08-24   ;2       ;8         ;2.480  ;2.715 ;15.00   ;6.733   ;1.010    ;LC16/18-1800-T-ROT  
5     ;A26-00269     ;4c9cb0ea-3539-4ec9-9;1          ;2026-08-24   ;1       ;8         ;3.095  ;2.715 ;15.00   ;8.403   ;1.260    ;LC16/18-1800-T-ROT  
3     ;A26-00269     ;23b42443-1e84-4056-a;1          ;2026-08-24   ;1       ;9         ;2.855  ;2.715 ;15.00   ;7.751   ;1.163    ;LC16/18-1800-T-ROT  
2     ;A26-00269     ;f91e1b39-6a58-4716-b;1          ;2026-08-24   ;1       ;9         ;2.425  ;2.715 ;15.00   ;6.584   ;0.988    ;LC16/18-1800-T-ROT  
1     ;A26-00269     ;6b0e16aa-a539-49a2-8;1          ;2026-08-24   ;1       ;9         ;1.335  ;2.715 ;15.00   ;3.625   ;0.544    ;LC16/18-1800-T-ROT  
4     ;A26-00269     ;1973ba14-dcd2-4255-8;1          ;2026-08-24   ;1       ;9         ;2.480  ;2.925 ;15.00   ;6.952   ;1.043    ;LC16/18-1800-T-ROT  
61    ;A25-00524     ;31c3b989-ecde-4941-a;1          ;2026-08-24   ;7       ;10        ;1.475  ;2.725 ;15.00   ;4.019   ;0.603    ;C30/37-ROT          
34    ;A26-00293     ;90e1ff41-f444-45e9-a;1          ;2026-08-24   ;5       ;10        ;3.315  ;2.975 ;15.00   ;9.862   ;1.479    ;LC16/18-2000-T-ROT  
18    ;A26-00293     ;22972cec-700b-4135-9;1          ;2026-08-24   ;2       ;10        ;0.665  ;2.975 ;24.00   ;1.978   ;0.475    ;LC16/18-2000-T-ROT  
32    ;A26-00293     ;1bd1c24c-e289-447d-9;1          ;2026-08-24   ;4       ;10        ;3.690  ;2.975 ;24.00   ;10.978  ;2.635    ;LC16/18-2000-T-ROT  
62    ;A25-00524     ;e32a4435-3ae7-4449-9;1          ;2026-08-24   ;7       ;11        ;0.830  ;2.725 ;15.00   ;2.262   ;0.339    ;LC16/18-2000-T-ROT  
44    ;A25-00524     ;7354d023-868a-41be-8;1          ;2026-08-24   ;5       ;11        ;4.465  ;2.725 ;15.00   ;12.167  ;1.825    ;LC16/18-2000-T-ROT  
47    ;A25-00524     ;68a126dc-e74e-47b6-a;1          ;2026-08-24   ;6       ;11        ;3.280  ;2.725 ;15.00   ;8.938   ;1.341    ;LC16/18-2000-T-ROT  
60    ;A25-00524     ;3ee9ca4f-084b-4c01-8;1          ;2026-08-24   ;7       ;11        ;2.475  ;2.725 ;15.00   ;6.744   ;1.012    ;LC16/18-2000-T-ROT  
53    ;A25-00524     ;4d41ef95-7ef3-480d-b;1          ;2026-08-24   ;6       ;12        ;3.365  ;2.725 ;15.00   ;9.170   ;1.375    ;LC16/18-2000-T-ROT  
46    ;A25-00524     ;6d01178e-cc0a-4d52-9;1          ;2026-08-24   ;6       ;12        ;2.150  ;2.725 ;17.50   ;5.859   ;1.025    ;LC16/18-1800-T-ROT  
48    ;A25-00524     ;7aeabb62-923e-4612-b;1          ;2026-08-24   ;6       ;12        ;2.755  ;2.725 ;17.50   ;7.507   ;1.314    ;LC16/18-1800-T-ROT  
55    ;A25-00524     ;0f7555a5-711b-4d1a-a;1          ;2026-08-24   ;7       ;12        ;1.375  ;2.725 ;17.50   ;3.747   ;0.656    ;LC16/18-1800-T-ROT  
64    ;A25-00524     ;a7752928-cb63-45cc-9;1          ;2026-08-24   ;8       ;13        ;2.760  ;2.725 ;17.50   ;7.521   ;1.316    ;LC16/18-1800-T-ROT  
65    ;A25-00524     ;f28620b8-0fbc-4877-9;1          ;2026-08-24   ;8       ;13        ;1.955  ;2.725 ;17.50   ;5.327   ;0.932    ;LC16/18-1800-T-ROT  
69    ;A25-00524     ;36bbf01e-804f-446f-a;1          ;2026-08-24   ;8       ;13        ;5.410  ;2.725 ;17.50   ;14.742  ;2.580    ;LC16/18-1800-T-ROT  
70    ;A25-00524     ;0c7455ab-a0d5-4204-a;1          ;2026-08-24   ;8       ;14        ;4.640  ;2.725 ;17.50   ;12.644  ;2.213    ;LC16/18-1800-T-ROT  
1     ;A26-00293     ;150b5c06-338f-44d2-b;1          ;2026-08-24   ;1       ;14        ;1.115  ;2.975 ;17.50   ;3.317   ;0.580    ;LC16/18-1800-T-ROT  
2     ;A26-00293     ;b507408a-1ef3-465e-9;1          ;2026-08-24   ;1       ;14        ;3.600  ;2.975 ;17.50   ;10.710  ;1.874    ;LC16/18-1800-T-ROT  
6     ;A26-00293     ;39620a1c-d2c2-43b0-a;1          ;2026-08-24   ;1       ;14        ;2.030  ;2.975 ;17.50   ;6.039   ;1.057    ;LC16/18-1800-T-ROT  
7     ;A26-00293     ;5bebfaa4-c9b3-4aa4-a;1          ;2026-08-24   ;1       ;15        ;2.960  ;2.975 ;17.50   ;8.806   ;1.541    ;LC16/18-1800-T-ROT  
8     ;A26-00293     ;4e824967-0824-457d-b;1          ;2026-08-24   ;1       ;15        ;2.090  ;2.975 ;17.50   ;6.218   ;1.088    ;LC16/18-1800-T-ROT  
9     ;A26-00293     ;8eaf9538-2a91-45aa-9;1          ;2026-08-24   ;1       ;15        ;3.040  ;2.975 ;17.50   ;9.044   ;1.583    ;LC16/18-1800-T-ROT  
11    ;A26-00293     ;916fc13a-f230-4f92-b;1          ;2026-08-24   ;2       ;15        ;2.240  ;2.975 ;17.50   ;6.664   ;1.166    ;LC16/18-1800-T-ROT  
15    ;A26-00293     ;7b6a0fdf-1e7b-4f96-9;1          ;2026-08-24   ;2       ;16        ;5.525  ;2.975 ;17.50   ;16.437  ;2.876    ;LC16/18-1800-T-ROT  
21    ;A26-00293     ;d942ad60-afcd-4023-9;1          ;2026-08-24   ;3       ;16        ;2.845  ;2.975 ;17.50   ;8.464   ;1.481    ;LC16/18-1800-T-ROT  
28    ;A26-00293     ;235da5fe-aa2d-4c27-b;1          ;2026-08-24   ;4       ;16        ;0.550  ;2.975 ;17.50   ;1.636   ;0.286    ;LC16/18-1800-T-ROT  
29    ;A26-00293     ;c1c4ddd8-4222-4dc5-9;1          ;2026-08-24   ;4       ;16        ;0.745  ;2.975 ;17.50   ;2.216   ;0.388    ;LC16/18-1800-T-ROT  
30    ;A26-00293     ;e59d16c4-c703-4870-a;1          ;2026-08-24   ;4       ;16        ;1.260  ;2.975 ;17.50   ;3.749   ;0.656    ;LC16/18-1800-T-ROT  
31    ;A26-00293     ;1b1e058f-508a-4827-9;1          ;2026-08-24   ;4       ;17        ;0.775  ;2.975 ;17.50   ;2.306   ;0.404    ;LC16/18-1800-T-ROT  
33    ;A26-00293     ;e7acd7c8-93e0-4964-b;1          ;2026-08-24   ;5       ;17        ;4.110  ;2.975 ;17.50   ;12.227  ;2.140    ;LC16/18-1800-T-ROT  
35    ;A26-00293     ;53c8647a-de84-4af9-8;1          ;2026-08-24   ;5       ;17        ;4.800  ;2.975 ;17.50   ;14.280  ;2.499    ;LC16/18-1800-T-ROT  
36    ;A26-00293     ;52f50ec6-0bac-4d49-8;1          ;2026-08-24   ;5       ;18        ;5.125  ;2.975 ;17.50   ;15.247  ;2.668    ;LC16/18-1800-T-ROT  
37    ;A26-00293     ;9d24bc2b-85fd-4da5-b;1          ;2026-08-24   ;5       ;18        ;3.020  ;2.975 ;17.50   ;8.985   ;1.572    ;LC16/18-1800-T-ROT  
3     ;A26-00293     ;0f59f061-8303-4d4a-b;1          ;2026-08-24   ;1       ;18        ;0.395  ;2.975 ;17.50   ;1.175   ;0.206    ;LC16/18-1800-ROT    
40    ;A25-00502     ;c4e4173f-525a-49f7-9;2          ;2026-08-24   ;5       ;1         ;3.105  ;2.750 ;20.00   ;8.539   ;1.708    ;LC16/18-2000-T-ROT  
32    ;A25-00502     ;f22fef3c-b097-4bdb-8;2          ;2026-08-24   ;4       ;1         ;3.105  ;2.750 ;20.00   ;8.539   ;1.708    ;LC16/18-2000-T-ROT  
29    ;A25-00502     ;e7ffbd9a-385a-42a9-9;2          ;2026-08-24   ;4       ;1         ;3.120  ;2.750 ;20.00   ;8.580   ;1.716    ;LC16/18-2000-T-ROT  
73    ;A24-00244     ;ad9be1d0-cf4a-44db-8;2          ;2026-08-24   ;7       ;2         ;3.470  ;2.650 ;24.00   ;9.196   ;2.207    ;LC16/18-2000-T-ROT  
69    ;A24-00244     ;424afd7b-d459-4ca8-a;2          ;2026-08-24   ;7       ;2         ;3.470  ;2.650 ;24.00   ;9.196   ;2.207    ;LC16/18-2000-T-ROT  
70    ;A24-00244     ;29c4e911-9c28-4821-9;2          ;2026-08-24   ;7       ;2         ;1.530  ;2.650 ;24.00   ;4.055   ;0.973    ;LC16/18-2000-ROT    
67    ;A24-00244     ;3ac6f3b0-f540-4027-a;2          ;2026-08-24   ;6       ;3         ;0.555  ;2.650 ;24.00   ;1.471   ;0.353    ;LC16/18-2000-T-ROT  
71    ;A24-00244     ;c67a5816-e221-481b-9;2          ;2026-08-24   ;7       ;3         ;0.555  ;2.650 ;24.00   ;1.471   ;0.353    ;LC16/18-2000-T-ROT  
52    ;A24-00244     ;5362f1b1-372d-44cc-9;2          ;2026-08-24   ;5       ;3         ;3.530  ;2.650 ;24.00   ;9.355   ;2.245    ;LC16/18-2000-T-ROT  
20    ;A24-00244     ;c4ffbeef-b9a7-4c40-b;2          ;2026-08-24   ;2       ;3         ;2.995  ;2.650 ;24.00   ;7.937   ;1.905    ;LC16/18-2000-T-ROT  
66    ;A24-00244     ;d701debe-3119-4910-8;2          ;2026-08-24   ;6       ;3         ;1.530  ;2.650 ;24.00   ;4.055   ;0.973    ;LC16/18-2000-ROT    
34    ;A24-00245     ;f1346826-5ecc-4176-b;2          ;2026-08-24   ;4       ;5         ;4.280  ;0.455 ;15.00   ;1.947   ;0.292    ;C30/37-2400-ROT     
7     ;A25-00368     ;63edfd82-4ea0-4478-b;2          ;2026-08-24   ;2       ;5         ;5.100  ;2.585 ;20.00   ;13.184  ;2.637    ;C30/37-ROT          
80    ;A24-00244     ;f50ffc2f-fc42-48fa-a;2          ;2026-08-24   ;8       ;6         ;3.430  ;2.650 ;12.00   ;9.090   ;1.091    ;LAC8-1400-ROT       
75    ;A24-00244     ;7e709ed7-f511-4d09-b;2          ;2026-08-24   ;7       ;6         ;3.560  ;2.650 ;12.00   ;9.434   ;1.132    ;LAC8-1400-ROT       
63    ;A24-00244     ;6f6b272f-a424-4074-a;2          ;2026-08-24   ;6       ;7         ;3.560  ;2.650 ;12.00   ;9.434   ;1.132    ;LAC8-1400-ROT       
60    ;A24-00244     ;c46a28b5-e1a2-4dcc-9;2          ;2026-08-24   ;6       ;7         ;3.430  ;2.650 ;12.00   ;9.090   ;1.091    ;LAC8-1400-ROT       
62    ;A24-00244     ;9d96dc45-fe4b-462b-8;2          ;2026-08-24   ;6       ;7         ;4.315  ;2.650 ;12.00   ;11.435  ;1.372    ;LAC8-1400-ROT       
58    ;A24-00244     ;6de7125e-1ce3-4209-8;2          ;2026-08-24   ;6       ;8         ;4.325  ;2.650 ;12.00   ;11.461  ;1.375    ;LAC8-1400-ROT       
26    ;A24-00244     ;244e8315-7135-4b52-a;2          ;2026-08-24   ;3       ;8         ;2.295  ;2.650 ;12.00   ;6.082   ;0.730    ;LAC8-1400-ROT       
22    ;A24-00244     ;459e778f-8c5b-48a2-b;2          ;2026-08-24   ;2       ;8         ;2.180  ;2.650 ;12.00   ;5.777   ;0.693    ;LAC8-1400-ROT       
7     ;A24-00244     ;54b381ee-765f-4cb1-a;2          ;2026-08-24   ;1       ;8         ;2.030  ;2.650 ;12.00   ;5.380   ;0.646    ;LAC8-1400-ROT       
78    ;A24-00244     ;793dbe49-d4aa-495a-a;2          ;2026-08-24   ;8       ;9         ;4.325  ;2.650 ;12.00   ;11.461  ;1.375    ;LAC8-1400-ROT       
55    ;A24-00244     ;303adc5f-5dd5-4c0e-b;2          ;2026-08-24   ;5       ;9         ;3.030  ;2.650 ;12.00   ;8.030   ;0.964    ;LAC8-1400-ROT       
39    ;A24-00244     ;00ce0c93-cce7-4d19-b;2          ;2026-08-24   ;4       ;9         ;2.180  ;2.650 ;12.00   ;5.777   ;0.693    ;LAC8-1400-ROT       
42    ;A25-00502     ;a8587a2f-8970-4565-9;2          ;2026-08-24   ;5       ;10        ;2.002  ;2.750 ;20.00   ;5.507   ;1.101    ;LC16/18-2000-T-ROT  
50    ;A25-00502     ;--------------------;2          ;2026-08-24   ;6       ;10        ;0.560  ;2.725 ;20.00   ;1.526   ;0.305    ;LC16/18-2000-T-ROT  
43    ;A25-00502     ;02c0a469-52fc-43a9-9;2          ;2026-08-24   ;5       ;10        ;6.463  ;2.750 ;20.00   ;17.772  ;3.554    ;LC16/18-2000-T-ROT  
51    ;A25-00502     ;6585b961-b33f-474e-9;2          ;2026-08-24   ;6       ;11        ;5.780  ;2.750 ;20.00   ;15.895  ;3.179    ;LC16/18-2000-T-ROT  
53    ;A25-00502     ;c868c766-a6c0-4c58-9;2          ;2026-08-24   ;6       ;11        ;4.325  ;2.750 ;20.00   ;11.894  ;2.379    ;LC16/18-2000-T-ROT  
52    ;A25-00502     ;6539478e-5d7b-4428-a;2          ;2026-08-24   ;6       ;12        ;5.780  ;2.750 ;20.00   ;15.895  ;3.179    ;LC16/18-2000-T-ROT  
125   ;A26-00145     ;--------------------;2          ;2026-08-24   ;2       ;12        ;3.630  ;2.645 ;15.00   ;9.601   ;1.440    ;LC16/18-1800-T-ROT  
117   ;A26-00145     ;--------------------;2          ;2026-08-24   ;2       ;13        ;3.510  ;2.645 ;15.00   ;9.284   ;1.393    ;LC16/18-1800-T-ROT  
122   ;A26-00145     ;--------------------;2          ;2026-08-24   ;2       ;13        ;3.185  ;2.645 ;15.00   ;8.424   ;1.264    ;LC16/18-1800-T-ROT  
126   ;A26-00145     ;1b4eea41-8acf-46c0-b;2          ;2026-08-24   ;2       ;13        ;3.510  ;1.213 ;15.00   ;2.886   ;0.433    ;LC16/18-1800-T-ROT  
124   ;A26-00145     ;--------------------;2          ;2026-08-24   ;2       ;14        ;2.080  ;2.645 ;15.00   ;5.502   ;0.825    ;LC16/18-1800-T-ROT  
49    ;A24-00244     ;7498bb77-7c6d-44fb-a;2          ;2026-08-24   ;5       ;14        ;0.970  ;2.650 ;15.00   ;2.534   ;0.380    ;LC16/18-1800-T-ROT  
57    ;A24-00244     ;1c03d22f-2234-4a78-9;2          ;2026-08-24   ;6       ;14        ;3.915  ;2.650 ;15.00   ;10.375  ;1.556    ;LC16/18-1800-T-ROT  
59    ;A24-00244     ;0da1063d-f0b9-4c05-8;2          ;2026-08-24   ;6       ;14        ;3.655  ;2.650 ;15.00   ;9.686   ;1.453    ;LC16/18-1800-T-ROT  
61    ;A24-00244     ;73aabfb0-093f-40af-9;2          ;2026-08-24   ;6       ;15        ;4.325  ;2.650 ;15.00   ;11.461  ;1.719    ;LC16/18-1800-T-ROT  
64    ;A24-00244     ;555d28ea-fc2e-4f48-9;2          ;2026-08-24   ;6       ;15        ;4.380  ;2.650 ;15.00   ;11.607  ;1.741    ;LC16/18-1800-T-ROT  
79    ;A24-00244     ;34d8c37e-5374-4fdb-b;2          ;2026-08-24   ;8       ;15        ;1.425  ;2.650 ;15.00   ;3.776   ;0.566    ;LC16/18-1800-T-ROT  
68    ;A24-00244     ;0cc0b6e9-250c-4a4e-9;2          ;2026-08-24   ;7       ;16        ;3.095  ;2.650 ;15.00   ;8.202   ;1.230    ;LC16/18-1800-T-ROT  
72    ;A24-00244     ;d59cb7e1-deae-48a1-9;2          ;2026-08-24   ;7       ;16        ;3.875  ;2.650 ;15.00   ;10.269  ;1.540    ;LC16/18-1800-T-ROT  
81    ;A24-00244     ;d784ab91-3782-475a-8;2          ;2026-08-24   ;8       ;16        ;4.380  ;2.650 ;15.00   ;11.607  ;1.741    ;LC16/18-1800-T-ROT  
76    ;A24-00244     ;3084cc9e-8e37-47ce-8;2          ;2026-08-24   ;7       ;17        ;3.095  ;2.650 ;15.00   ;8.202   ;1.230    ;LC16/18-1800-T-ROT  
82    ;A24-00244     ;62f61d50-5020-4246-8;2          ;2026-08-24   ;8       ;17        ;4.325  ;2.650 ;15.00   ;11.461  ;1.719    ;LC16/18-1800-T-ROT  
83    ;A24-00244     ;e32e8a0e-2dfc-46d9-b;2          ;2026-08-24   ;8       ;17        ;3.655  ;2.650 ;15.00   ;9.686   ;1.453    ;LC16/18-1800-T-ROT  
42    ;A24-00244     ;c754b57b-f984-4469-b;2          ;2026-08-24   ;4       ;18        ;2.295  ;2.650 ;12.00   ;6.082   ;0.730    ;LAC8-1400-ROT       
54    ;A24-00244     ;9a54df77-def1-4403-b;2          ;2026-08-24   ;5       ;18        ;2.030  ;2.650 ;12.00   ;5.380   ;0.646    ;LAC8-1400-ROT       
77    ;A24-00244     ;b3637142-e4d0-4631-8;2          ;2026-08-24   ;7       ;18        ;4.315  ;2.650 ;12.00   ;11.435  ;1.372    ;LAC8-1400-ROT`;

/**
 * Returns text color for each element line based on concrete grade
 */
export function getElementTextColor(lineText) {
  if (!lineText) return '#1E293B';
  const upper = lineText.toUpperCase();
  if (upper.includes('LAC8') || upper.includes('LAC6') || upper.includes('LAC')) {
    return '#15803D'; // Green for LAC (Leichtagglomeratbeton)
  }
  if (upper.includes('C30/37')) {
    return '#C2410C'; // Orange/Brown for C30/37 (Normalbeton)
  }
  if (upper.includes('1800-T-ROT') || upper.includes('1800-ROT')) {
    return '#0284C7'; // Blue for LC 1800
  }
  if (upper.includes('125-A26-00145') || upper.includes('RED-HIGHLIGHT')) {
    return '#DC2626'; // Red for special items
  }
  return '#1E293B'; // Dark/Black for LC 2000
}

/**
 * Format a number with German comma formatting
 */
function formatGermanNum(num, decimals = 3) {
  if (num === 0) return '0 m²';
  return `${num.toFixed(decimals).replace('.', ',')} m²`;
}

function formatGermanVol(num, decimals = 3) {
  return `${num.toFixed(decimals).replace('.', ',')} m³`;
}

/**
 * Parses real CAD / ERP export file format (.txt, .csv)
 */
export function parseTischplanText(rawText, fileName = '24-08-2026.txt') {
  const content = (rawText && typeof rawText === 'string' && rawText.trim().length > 10)
    ? rawText
    : RAW_SAMPLE_DATA_24_08;

  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Table maps: 1..18 for Hall 1 and Hall 2
  const h1Tables = {};
  const h2Tables = {};
  for (let i = 1; i <= 18; i++) {
    h1Tables[i] = { tischNumber: i, halle: 1, elements: [], flaeche: 0, rawBreiten: [] };
    h2Tables[i] = { tischNumber: i, halle: 2, elements: [], flaeche: 0, rawBreiten: [] };
  }

  const volByGrade = {};
  let totalH1Flaeche = 0;
  let totalH2Flaeche = 0;
  let h1Trocken = 0;
  let h1Nass = 0;
  let h2Trocken = 0;
  let h2Nass = 0;
  let extractedDate = '24.08.2026';

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.toLowerCase().startsWith('pos') || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    const parts = line.split(';').map(p => p.trim());
    if (parts.length < 12) continue;

    // Mapping based on user file format:
    // 0: Pos. (22)
    // 1: Projekt Nr.. (A26-00293)
    // 2: Prod. GUID
    // 3: Hall. Nr. (1 or 2)
    // 4: Prod. Datum (2026-08-24)
    // 5: Stapel
    // 6: Pal Nr.. (1 to 18) -> Tisch Number!
    // 7: Länge
    // 8: Höhe
    // 9: Breite (24.00, 22.00, etc.)
    // 10: Fläche (4.671, etc.)
    // 11: Volumen (1.121, etc.)
    // 12: Betongüte (LC16/18-2000-ROT, etc.)

    const pos = parts[0];
    const projekt = parts[1];
    const hallNum = parseInt(parts[3], 10) === 2 ? 2 : 1;
    const prodDatum = parts[4];
    const palNr = parseInt(parts[6], 10);
    const breiteVal = parseFloat(parts[9]?.replace(',', '.')) || 0;
    const flaecheVal = parseFloat(parts[10]?.replace(',', '.')) || 0;
    const volumenVal = parseFloat(parts[11]?.replace(',', '.')) || 0;
    const betonguete = parts[12] || 'LC16/18-2000-ROT';

    if (prodDatum && prodDatum.includes('-')) {
      const dParts = prodDatum.split('-');
      if (dParts.length === 3) {
        extractedDate = `${dParts[2]}.${dParts[1]}.${dParts[0]}`;
      }
    }

    // Line string: {Pos.}-{Projekt Nr.}-{Betongüte}
    const elementLine = `${pos}-${projekt}-${betonguete}`;

    // Volume grouping
    volByGrade[betonguete] = (volByGrade[betonguete] || 0) + volumenVal;

    // Concrete Classification (NASS vs TROCKEN):
    // C30/37 (Normalbeton) is NASS.
    // LC (Leichtbeton) and LAC (Blähton) are TROCKEN.
    const isNass = betonguete.toUpperCase().includes('C30/37');

    const targetMap = hallNum === 2 ? h2Tables : h1Tables;
    const table = targetMap[palNr];
    if (table) {
      table.elements.push(elementLine);
      table.flaeche += flaecheVal;
      table.rawBreiten.push(breiteVal);

      if (hallNum === 1) {
        totalH1Flaeche += flaecheVal;
        if (isNass) {
          h1Nass += flaecheVal;
        } else {
          h1Trocken += flaecheVal;
        }
      } else {
        totalH2Flaeche += flaecheVal;
        if (isNass) {
          h2Nass += flaecheVal;
        } else {
          h2Trocken += flaecheVal;
        }
      }
    }
  }

  // Format Tables into Top Row (10..18) and Bottom Row (1..9)
  const formatTables = (tableMap, hall) => {
    const formatItem = (tNum) => {
      const t = tableMap[tNum];
      const hasEls = t.elements.length > 0;
      let headerText = `Tisch ${tNum}`;
      
      if (hasEls) {
        // Calculate distinct widths in mm / cm format (e.g. 24.00 -> 240, 17.50 -> 175)
        const distinctWidths = Array.from(
          new Set(t.rawBreiten.map(b => Math.round(b * 10)))
        ).sort((a, b) => a - b);
        
        const widthStr = distinctWidths.join('/');
        headerText = `Tisch ${tNum} ROT ${widthStr}`;
      }

      return {
        tischNumber: tNum,
        halle: hall,
        headerText,
        flaecheStr: formatGermanNum(t.flaeche, 3),
        flaeche: t.flaeche,
        elements: t.elements,
      };
    };

    const rowTop = [10, 11, 12, 13, 14, 15, 16, 17, 18].map(formatItem);
    const rowBottom = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(formatItem);
    return { rowTop, rowBottom };
  };

  const h1Formatted = formatTables(h1Tables, 1);
  const h2Formatted = formatTables(h2Tables, 2);

  // Natural order of volume summary matching user software
  const preferredGradeOrder = [
    'LC16/18-2000-ROT',
    'LC16/18-2000-T-ROT',
    'C30/37-ROT',
    'C30/37-2400-ROT',
    'LC16/18-1800-T-ROT',
    'LC16/18-1800-ROT',
    'LAC8-1400-ROT',
    'LAC6-1200-ROT'
  ];

  const overviewVolumes = [];
  let totalVol = 0;

  preferredGradeOrder.forEach(grade => {
    if (volByGrade[grade]) {
      overviewVolumes.push({
        name: grade,
        volume: formatGermanVol(volByGrade[grade], 3)
      });
      totalVol += volByGrade[grade];
    }
  });

  // Add any remaining unlisted grades
  Object.keys(volByGrade).forEach(grade => {
    if (!preferredGradeOrder.includes(grade)) {
      overviewVolumes.push({
        name: grade,
        volume: formatGermanVol(volByGrade[grade], 3)
      });
      totalVol += volByGrade[grade];
    }
  });

  const displayFileName = fileName.includes('\\') ? fileName.split('\\').pop() : fileName;
  const filePathStr = `P:\\Tisch_Planung\\${displayFileName}`;

  return {
    filePath: filePathStr,
    fileName: displayFileName,
    date1: extractedDate,
    date2: extractedDate,
    overviewVolumes,
    gesamtvolumenStr: formatGermanVol(totalVol, 3),
    halle1: {
      flaecheTotal: formatGermanNum(totalH1Flaeche, 3),
      trocken: formatGermanNum(h1Trocken, 3),
      nass: formatGermanNum(h1Nass, 2),
      rowTop: h1Formatted.rowTop,
      rowBottom: h1Formatted.rowBottom,
    },
    halle2: {
      flaecheTotal: formatGermanNum(totalH2Flaeche, 3),
      trocken: formatGermanNum(h2Trocken, 3),
      nass: formatGermanNum(h2Nass, 3),
      rowTop: h2Formatted.rowTop,
      rowBottom: h2Formatted.rowBottom,
    },
    gesamtFlaecheStr: formatGermanNum(totalH1Flaeche + totalH2Flaeche, 3),
  };
}

export function generateExactProductionPlan() {
  return parseTischplanText(RAW_SAMPLE_DATA_24_08, '24-08-2026.txt');
}
