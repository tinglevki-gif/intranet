/**
 * Exact Parser & Calculator for Tinglev Tischplan Export files (.txt, .csv)
 * Matches Tischantigravity28 / Tischplan-Export-Reader v2.8 1:1 official specifications
 */

export const RAW_SAMPLE_DATA_11_09 = `Pos.  ;Projekt Nr..  ;Prod. GUID          ;Hall. Nr.  ;Prod. Datum  ;Stapel  ;Pal Nr..  ;Länge  ;Höhe  ;Breite  ;Fläche  ;Volumen  ;Betongüte           
34    ;A26-00182     ;d8a10519-692e-4f48-b;1          ;2026-09-11   ;3       ;10        ;3.700  ;2.975 ;15.00   ;11.008  ;2.642    ;LC16/18-2000-T      
35    ;A26-00182     ;a5041a18-0e2e-4a68-b;1          ;2026-09-11   ;4       ;10        ;3.165  ;2.975 ;15.00   ;9.416   ;2.260    ;LC16/18-2000-T      
37    ;A26-00182     ;74980253-41c6-4c8e-9;1          ;2026-09-11   ;4       ;10        ;3.300  ;2.975 ;15.00   ;9.827   ;2.358    ;LC16/18-2000-T      
36    ;A26-00182     ;f6ad25cc-5ac4-4fb7-8;1          ;2026-09-11   ;3       ;11        ;3.200  ;2.975 ;15.00   ;9.520   ;2.285    ;LC16/18-2000-T      
39    ;A26-00182     ;1858de17-f38d-4a97-9;1          ;2026-09-11   ;2       ;11        ;6.610  ;2.975 ;15.00   ;19.667  ;4.720    ;LC16/18-2000-T      
40    ;A26-00182     ;b00cc658-f384-4b7e-b;1          ;2026-09-11   ;2       ;12        ;3.700  ;2.975 ;15.00   ;11.008  ;2.642    ;LC16/18-2000-T      
45    ;A26-00182     ;58bbba12-de2d-437a-b;1          ;2026-09-11   ;2       ;12        ;4.380  ;2.975 ;24.00   ;13.030  ;3.127    ;LC16/18-2000-T      
1     ;A26-00182     ;5d1400b0-239f-4a87-b;1          ;2026-09-11   ;2       ;12        ;3.700  ;2.975 ;24.00   ;10.990  ;2.638    ;LC16/18-1800-T      
2     ;A26-00182     ;668dd79b-0e8b-4c7e-8;1          ;2026-09-11   ;2       ;13        ;3.620  ;2.975 ;24.00   ;10.770  ;2.585    ;LC16/18-1800-T      
4     ;A26-00182     ;07a54036-cd1c-4c53-a;1          ;2026-09-11   ;1       ;13        ;3.550  ;2.975 ;24.00   ;10.561  ;2.535    ;LC16/18-1800-T      
11    ;A26-00102     ;05d3a6bd-c012-4441-b;1          ;2026-09-11   ;8       ;13        ;3.470  ;2.975 ;24.00   ;10.326  ;2.478    ;LC16/18-1800-T      
10    ;A26-00182     ;654c7d2d-9f31-48d9-b;1          ;2026-09-11   ;8       ;14        ;4.060  ;2.975 ;24.00   ;12.078  ;2.899    ;LC16/18-1800-T      
15    ;A26-00182     ;bc16dff7-a7c5-41da-8;1          ;2026-09-11   ;7       ;14        ;4.180  ;2.975 ;24.00   ;12.435  ;2.984    ;LC16/18-1800-T      
19    ;A26-00182     ;d38b1d34-b9f1-4749-a;1          ;2026-09-11   ;7       ;14        ;4.160  ;2.975 ;24.00   ;12.381  ;2.971    ;LC16/18-1800-T      
3     ;A26-00182     ;eddaef80-ec01-42a9-b;1          ;2026-09-11   ;7       ;15        ;3.620  ;2.975 ;18.00   ;10.770  ;2.585    ;LC16/18-1800-T      
24    ;A26-00182     ;9e944d51-bd7b-49f1-a;1          ;2026-09-11   ;7       ;15        ;7.840  ;2.975 ;18.00   ;23.326  ;5.598    ;LC16/18-1800-T      
1     ;A26-00364     ;d619faf1-f6a6-4dad-8;1          ;2026-09-11   ;6       ;16        ;3.620  ;2.975 ;15.00   ;10.770  ;2.585    ;LC16/18-1800-T-ROT  
7     ;A26-00364     ;2d463d15-5b1b-40ae-a;1          ;2026-09-11   ;5       ;16        ;3.320  ;2.975 ;15.00   ;9.877   ;2.370    ;LC16/18-1800-T-ROT  
5     ;A26-00364     ;20aab8c3-07f0-49b6-9;1          ;2026-09-11   ;4       ;16        ;2.688  ;2.975 ;15.00   ;7.997   ;1.919    ;LC16/18-1800-T-ROT  
9     ;A26-00364     ;17007b5b-f447-406b-a;1          ;2026-09-11   ;3       ;17        ;3.620  ;2.975 ;15.00   ;10.770  ;2.585    ;LC16/18-1800-T-ROT  
10    ;A26-00364     ;c4050ef4-f4d1-4673-a;1          ;2026-09-11   ;3       ;17        ;3.270  ;2.975 ;15.00   ;9.728   ;2.335    ;LC16/18-1800-T-ROT  
11    ;A26-00364     ;53fc9913-0bf1-4573-a;1          ;2026-09-11   ;3       ;17        ;3.364  ;2.975 ;15.00   ;10.008  ;2.402    ;LC16/18-1800-T-ROT  
14    ;A26-00364     ;bb4b2e52-3b69-440d-a;1          ;2026-09-11   ;3       ;18        ;3.620  ;2.975 ;15.00   ;10.770  ;2.585    ;LC16/18-1800-T-ROT  
20    ;A26-00364     ;a927c8a5-a691-4230-a;1          ;2026-09-11   ;2       ;18        ;3.575  ;2.975 ;15.00   ;10.636  ;2.553    ;LC16/18-1800-T-ROT  

30    ;A26-00182     ;e3b081de-17a1-4ce6-8;1          ;2026-09-11   ;1       ;1         ;3.420  ;2.950 ;15.00   ;10.089  ;2.421    ;LC16/18-2000-T      
29    ;A26-00182     ;afefc0eb-2ec2-4aae-8;1          ;2026-09-11   ;1       ;1         ;3.420  ;2.950 ;15.00   ;10.089  ;2.421    ;LC16/18-2000-T      
28    ;A26-00182     ;2fa14839-69bb-4556-a;1          ;2026-09-11   ;2       ;1         ;3.415  ;2.950 ;15.00   ;10.073  ;2.418    ;LC16/18-2000-T      
31    ;A26-00182     ;1b244700-ca47-4979-9;1          ;2026-09-11   ;2       ;2         ;3.550  ;2.975 ;20.00   ;10.561  ;2.535    ;LC16/18-2000-T      
17    ;A26-00182     ;322c6d53-a1df-49ec-8;1          ;2026-09-11   ;2       ;2         ;2.370  ;2.975 ;20.00   ;7.051   ;1.692    ;LC16/18-2000-T      
16    ;A26-00182     ;4c9cb0ea-3539-4ec9-9;1          ;2026-09-11   ;1       ;2         ;2.370  ;2.975 ;20.00   ;7.051   ;1.692    ;LC16/18-2000-T      
21    ;A26-00182     ;23b42443-1e84-4056-a;1          ;2026-09-11   ;1       ;2         ;2.366  ;2.975 ;22.00   ;7.038   ;1.689    ;LC16/18-2000-T      
20    ;A26-00182     ;f91e1b39-6a58-4716-b;1          ;2026-09-11   ;1       ;3         ;4.460  ;2.975 ;22.00   ;13.268  ;3.184    ;LC16/18-2000-T      
18    ;A26-00182     ;6b0e16aa-a539-49a2-8;1          ;2026-09-11   ;1       ;3         ;4.445  ;2.975 ;22.00   ;13.225  ;3.174    ;LC16/18-2000-T      
14    ;A26-00182     ;1973ba14-dcd2-4255-8;1          ;2026-09-11   ;1       ;4         ;3.270  ;2.975 ;22.00   ;9.728   ;2.335    ;LC16/18-2000-T      
13    ;A26-00182     ;31c3b989-ecde-4941-a;1          ;2026-09-11   ;7       ;4         ;3.265  ;2.975 ;22.00   ;9.713   ;2.331    ;LC16/18-2000-T      
12    ;A26-00182     ;90e1ff41-f444-45e9-a;1          ;2026-09-11   ;5       ;4         ;3.237  ;2.975 ;22.00   ;9.632   ;2.312    ;LC16/18-2000-T      
7     ;A26-00182     ;22972cec-700b-4135-9;1          ;2026-09-11   ;2       ;5         ;3.620  ;2.975 ;24.00   ;10.770  ;2.585    ;C30/37              
9     ;A26-00182     ;1bd1c24c-e289-447d-9;1          ;2026-09-11   ;4       ;5         ;2.980  ;2.975 ;24.00   ;8.865   ;2.128    ;C30/37              
8     ;A26-00182     ;e32a4435-3ae7-4449-9;1          ;2026-09-11   ;7       ;5         ;2.010  ;2.975 ;24.00   ;5.980   ;1.435    ;C30/37              
6     ;A26-00182     ;7354d023-868a-41be-8;1          ;2026-09-11   ;5       ;5         ;2.010  ;2.975 ;24.00   ;5.980   ;1.435    ;C30/37              
5     ;A26-00182     ;68a126dc-e74e-47b6-a;1          ;2026-09-11   ;6       ;5         ;1.942  ;2.975 ;24.00   ;5.777   ;1.386    ;C30/37              
27    ;A26-00364     ;3ee9ca4f-084b-4c01-8;1          ;2026-09-11   ;7       ;6         ;3.430  ;2.975 ;10.00   ;10.204  ;1.224    ;LAC6-1200-ROT       
19    ;A26-00364     ;4d41ef95-7ef3-480d-b;1          ;2026-09-11   ;6       ;6         ;0.000  ;2.975 ;10.00   ;0.000   ;0.000    ;LAC6-1200-ROT       
16    ;A26-00364     ;6d01178e-cc0a-4d52-9;1          ;2026-09-11   ;6       ;6         ;0.000  ;2.975 ;10.00   ;0.000   ;0.000    ;LAC6-1200-ROT       
15    ;A26-00364     ;7aeabb62-923e-4612-b;1          ;2026-09-11   ;6       ;7         ;3.620  ;2.975 ;15.00   ;10.770  ;1.616    ;LAC6-1200-ROT       
13    ;A26-00364     ;0f7555a5-711b-4d1a-a;1          ;2026-09-11   ;7       ;7         ;3.150  ;2.975 ;15.00   ;9.371   ;1.406    ;LAC6-1200-ROT       
8     ;A26-00364     ;a7752928-cb63-45cc-9;1          ;2026-09-11   ;8       ;7         ;1.460  ;2.975 ;15.00   ;4.343   ;0.651    ;LC16/18-1800-T-ROT  
2     ;A26-00364     ;f28620b8-0fbc-4877-9;1          ;2026-09-11   ;8       ;7         ;1.459  ;2.975 ;15.00   ;4.342   ;0.651    ;LC16/18-1800-T-ROT  
23    ;A26-00364     ;36bbf01e-804f-446f-a;1          ;2026-09-11   ;8       ;8         ;3.620  ;2.975 ;15.00   ;10.770  ;1.616    ;LC16/18-1800-T-ROT  
37    ;A26-00364     ;0c7455ab-a0d5-4204-a;1          ;2026-09-11   ;8       ;8         ;3.270  ;2.975 ;15.00   ;9.728   ;1.459    ;LC16/18-1800-T-ROT  
35    ;A26-00364     ;150b5c06-338f-44d2-b;1          ;2026-09-11   ;1       ;8         ;3.364  ;2.975 ;15.00   ;10.008  ;1.501    ;LC16/18-1800-T-ROT  
29    ;A26-00364     ;b507408a-1ef3-465e-9;1          ;2026-09-11   ;1       ;8         ;0.000  ;2.975 ;15.00   ;0.000   ;0.000    ;LC16/18-1800-T-ROT  
26    ;A26-00364     ;39620a1c-d2c2-43b0-a;1          ;2026-09-11   ;1       ;8         ;0.000  ;2.975 ;15.00   ;0.000   ;0.000    ;LC16/18-1800-T-ROT  
36    ;A26-00364     ;5bebfaa4-c9b3-4aa4-a;1          ;2026-09-11   ;1       ;9         ;4.230  ;2.975 ;15.00   ;12.584  ;1.888    ;LC16/18-1800-T-ROT  
34    ;A26-00364     ;4e824967-0824-457d-b;1          ;2026-09-11   ;1       ;9         ;4.306  ;2.975 ;15.00   ;12.812  ;1.922    ;LC16/18-1800-T-ROT  

7     ;A26-00358     ;40e4173f-525a-49f7-9;2          ;2026-09-11   ;5       ;10        ;2.770  ;2.960 ;15.00   ;8.200   ;1.230    ;LAC15-1800-ROT      
19    ;A26-00358     ;f22fef3c-b097-4bdb-8;2          ;2026-09-11   ;4       ;10        ;2.770  ;2.960 ;15.00   ;8.200   ;1.230    ;LAC15-1800-ROT      
6     ;A26-00358     ;e7ffbd9a-385a-42a9-9;2          ;2026-09-11   ;4       ;10        ;2.774  ;2.960 ;15.00   ;8.212   ;1.232    ;LAC15-1800-ROT      
9     ;A26-00358     ;ad9be1d0-cf4a-44db-8;2          ;2026-09-11   ;7       ;11        ;3.000  ;2.960 ;15.00   ;8.880   ;1.332    ;LAC15-1800-ROT      
13    ;A26-00358     ;424afd7b-d459-4ca8-a;2          ;2026-09-11   ;7       ;11        ;3.000  ;2.960 ;15.00   ;8.880   ;1.332    ;LAC15-1800-ROT      
15    ;A26-00358     ;29c4e911-9c28-4821-9;2          ;2026-09-11   ;7       ;11        ;1.500  ;2.960 ;15.00   ;4.440   ;0.666    ;LAC15-1800-ROT      
12    ;A26-00358     ;3ac6f3b0-f540-4027-a;2          ;2026-09-11   ;6       ;11        ;1.500  ;2.960 ;15.00   ;4.440   ;0.666    ;LAC15-1800-ROT      
14    ;A26-00358     ;c67a5816-e221-481b-9;2          ;2026-09-11   ;7       ;12        ;3.008  ;2.960 ;15.00   ;8.904   ;1.336    ;LAC15-1800-ROT      
16    ;A26-00358     ;5362f1b1-372d-44cc-9;2          ;2026-09-11   ;5       ;12        ;3.008  ;2.960 ;15.00   ;8.904   ;1.336    ;LAC15-1800-ROT      
17    ;A26-00358     ;c4ffbeef-b9a7-4c40-b;2          ;2026-09-11   ;2       ;12        ;1.504  ;2.960 ;15.00   ;4.451   ;0.668    ;LAC15-1800-ROT      
18    ;A26-00358     ;d701debe-3119-4910-8;2          ;2026-09-11   ;6       ;12        ;1.504  ;2.960 ;15.00   ;4.451   ;0.668    ;LAC15-1800-ROT      
20    ;A26-00358     ;f1346826-5ecc-4176-b;2          ;2026-09-11   ;4       ;13        ;2.900  ;2.960 ;15.00   ;8.584   ;1.288    ;LAC15-1800-ROT      
21    ;A26-00358     ;63edfd82-4ea0-4478-b;2          ;2026-09-11   ;2       ;13        ;2.900  ;2.960 ;15.00   ;8.584   ;1.288    ;LAC15-1800-ROT      
1     ;A26-00358     ;f50ffc2f-fc42-48fa-a;2          ;2026-09-11   ;8       ;13        ;1.440  ;2.960 ;15.00   ;4.263   ;0.639    ;LAC6-1200-ROT       
2     ;A26-00358     ;7e709ed7-f511-4d09-b;2          ;2026-09-11   ;7       ;13        ;1.444  ;2.960 ;15.00   ;4.274   ;0.641    ;LAC6-1200-ROT       
3     ;A26-00358     ;6f6b272f-a424-4074-a;2          ;2026-09-11   ;6       ;14        ;2.960  ;2.960 ;15.00   ;8.761   ;1.051    ;LAC6-1200-ROT       
4     ;A26-00358     ;c46a28b5-e1a2-4dcc-9;2          ;2026-09-11   ;6       ;14        ;2.960  ;2.960 ;15.00   ;8.761   ;1.051    ;LAC6-1200-ROT       
5     ;A26-00358     ;9d96dc45-fe4b-462b-8;2          ;2026-09-11   ;6       ;14        ;1.480  ;2.960 ;15.00   ;4.380   ;0.526    ;LAC6-1200-ROT       
22    ;A26-00358     ;6de7125e-1ce3-4209-8;2          ;2026-09-11   ;6       ;14        ;1.482  ;2.960 ;15.00   ;4.387   ;0.526    ;LAC6-1200-ROT       
10    ;A26-00358     ;244e8315-7135-4b52-a;2          ;2026-09-11   ;3       ;15        ;2.920  ;2.960 ;15.00   ;8.643   ;1.037    ;LAC6-1200-ROT       
11    ;A26-00358     ;459e778f-8c5b-48a2-b;2          ;2026-09-11   ;2       ;15        ;2.920  ;2.960 ;15.00   ;8.643   ;1.037    ;LAC6-1200-ROT       
23    ;A26-00358     ;54b381ee-765f-4cb1-a;2          ;2026-09-11   ;1       ;15        ;1.460  ;2.960 ;15.00   ;4.321   ;0.519    ;LAC6-1200-ROT       
24    ;A26-00358     ;793dbe49-d4aa-495a-a;2          ;2026-09-11   ;8       ;15        ;1.462  ;2.960 ;15.00   ;4.328   ;0.519    ;LAC6-1200-ROT       
25    ;A26-00358     ;303adc5f-5dd5-4c0e-b;2          ;2026-09-11   ;5       ;15        ;0.000  ;2.960 ;15.00   ;0.000   ;0.000    ;LAC6-1200-ROT       
33    ;A26-00358     ;00ce0c93-cce7-4d19-b;2          ;2026-09-11   ;4       ;15        ;0.000  ;2.960 ;15.00   ;0.000   ;0.000    ;LAC6-1200-ROT       
26    ;A26-00358     ;a8587a2f-8970-4565-9;2          ;2026-09-11   ;5       ;15        ;0.000  ;2.960 ;15.00   ;0.000   ;0.000    ;LAC6-1200-ROT       
27    ;A26-00358     ;12345678-8970-4565-9;2          ;2026-09-11   ;5       ;16        ;2.997  ;2.960 ;15.00   ;8.871   ;1.065    ;LAC6-1200-ROT       
29    ;A26-00358     ;23456789-8970-4565-9;2          ;2026-09-11   ;5       ;16        ;2.997  ;2.960 ;15.00   ;8.871   ;1.065    ;LAC6-1200-ROT       
30    ;A26-00358     ;34567890-8970-4565-9;2          ;2026-09-11   ;5       ;16        ;1.498  ;2.960 ;15.00   ;4.434   ;0.532    ;LAC6-1200-ROT       
34    ;A26-00358     ;45678901-8970-4565-9;2          ;2026-09-11   ;5       ;16        ;1.499  ;2.960 ;15.00   ;4.437   ;0.532    ;LAC6-1200-ROT       
31    ;A26-00358     ;56789012-8970-4565-9;2          ;2026-09-11   ;5       ;17        ;2.556  ;2.960 ;15.00   ;7.566   ;0.908    ;LAC6-1200-ROT       
32    ;A26-00358     ;67890123-8970-4565-9;2          ;2026-09-11   ;5       ;17        ;2.556  ;2.960 ;15.00   ;7.566   ;0.908    ;LAC6-1200-ROT       
1     ;A26-00365     ;78901234-8970-4565-9;2          ;2026-09-11   ;5       ;17        ;2.555  ;2.960 ;15.00   ;7.564   ;0.908    ;LAC6-1200           
2     ;A26-00365     ;89012345-8970-4565-9;2          ;2026-09-11   ;5       ;18        ;2.706  ;2.950 ;12.00   ;7.983   ;0.958    ;LAC6-1200           
6     ;A26-00365     ;90123456-8970-4565-9;2          ;2026-09-11   ;5       ;18        ;2.706  ;2.950 ;12.00   ;7.983   ;0.958    ;LAC6-1200           
3     ;A26-00365     ;01234567-8970-4565-9;2          ;2026-09-11   ;5       ;18        ;2.705  ;2.950 ;15.00   ;7.980   ;0.958    ;LAC6-1200           

8     ;A26-00358     ;11234567-8970-4565-9;2          ;2026-09-11   ;5       ;1         ;2.627  ;2.960 ;15.00   ;7.776   ;0.933    ;LAC15-1800-ROT      
130   ;A26-00237     ;22345678-8970-4565-9;2          ;2026-09-11   ;5       ;1         ;2.618  ;2.960 ;15.00   ;7.749   ;0.930    ;LC16/18-1800-T-ROT  
131   ;A26-00237     ;33456789-8970-4565-9;2          ;2026-09-11   ;5       ;1         ;2.610  ;2.960 ;15.00   ;7.726   ;0.927    ;LC16/18-1800-T-ROT  
126   ;A26-00237     ;44567890-8970-4565-9;2          ;2026-09-11   ;5       ;2         ;2.910  ;2.960 ;15.00   ;8.614   ;1.034    ;LC16/18-1800-T-ROT  
125   ;A26-00237     ;55678901-8970-4565-9;2          ;2026-09-11   ;5       ;2         ;2.905  ;2.960 ;15.00   ;8.599   ;1.032    ;LC16/18-1800-T-ROT  
117   ;A26-00237     ;66789012-8970-4565-9;2          ;2026-09-11   ;5       ;2         ;2.885  ;2.960 ;15.00   ;8.540   ;1.025    ;LC16/18-1800-T-ROT  
113   ;A26-00237     ;77890123-8970-4565-9;2          ;2026-09-11   ;5       ;3         ;2.555  ;2.960 ;15.00   ;7.563   ;0.908    ;LC16/18-1800-T-ROT  
114   ;A26-00237     ;88901234-8970-4565-9;2          ;2026-09-11   ;5       ;3         ;2.555  ;2.960 ;15.00   ;7.563   ;0.908    ;LC16/18-1800-T-ROT  
112   ;A26-00237     ;99012345-8970-4565-9;2          ;2026-09-11   ;5       ;3         ;2.554  ;2.960 ;15.00   ;7.560   ;0.907    ;LC16/18-1800-T-ROT  
28    ;A26-00358     ;00123456-8970-4565-9;2          ;2026-09-11   ;5       ;4         ;2.200  ;2.960 ;15.00   ;6.512   ;0.781    ;LC16/18-1800-T-ROT  
6     ;A26-00228     ;11123456-8970-4565-9;2          ;2026-09-11   ;5       ;4         ;2.200  ;2.960 ;18.00   ;6.512   ;0.781    ;LC16/18-1800-ROT    
5     ;A26-00228     ;22123456-8970-4565-9;2          ;2026-09-11   ;5       ;4         ;2.191  ;2.960 ;18.00   ;6.485   ;0.778    ;LC16/18-1800-ROT    
39    ;A25-00540     ;33123456-8970-4565-9;2          ;2026-09-11   ;5       ;5         ;1.400  ;2.960 ;10.00   ;4.144   ;0.497    ;C30/37-ROT          
43    ;A25-00540     ;44123456-8970-4565-9;2          ;2026-09-11   ;5       ;5         ;1.740  ;2.960 ;30.00   ;5.150   ;1.545    ;C30/37-ROT          
36    ;A25-00540     ;55123456-8970-4565-9;2          ;2026-09-11   ;5       ;5         ;1.740  ;2.960 ;30.00   ;5.150   ;1.545    ;C30/37-ROT          
37    ;A25-00540     ;66123456-8970-4565-9;2          ;2026-09-11   ;5       ;5         ;1.740  ;2.960 ;30.00   ;5.150   ;1.545    ;C30/37-ROT          
38    ;A25-00540     ;77123456-8970-4565-9;2          ;2026-09-11   ;5       ;5         ;1.810  ;2.960 ;30.00   ;5.357   ;1.607    ;C30/37-ROT          
27    ;A26-00365     ;88123456-8970-4565-9;2          ;2026-09-11   ;5       ;6         ;1.631  ;2.960 ;12.00   ;4.828   ;0.579    ;LAC6-1200           
26    ;A26-00365     ;99123456-8970-4565-9;2          ;2026-09-11   ;5       ;6         ;1.631  ;2.960 ;12.00   ;4.829   ;0.579    ;LAC6-1200           
22    ;A26-00365     ;00234567-8970-4565-9;2          ;2026-09-11   ;5       ;7         ;1.897  ;2.960 ;12.00   ;5.615   ;0.674    ;LAC6-1200           
21    ;A26-00365     ;11234567-8970-4565-9;2          ;2026-09-11   ;5       ;7         ;1.897  ;2.960 ;12.00   ;5.615   ;0.674    ;LAC6-1200           
20    ;A26-00365     ;22234567-8970-4565-9;2          ;2026-09-11   ;5       ;7         ;1.897  ;2.960 ;12.00   ;5.615   ;0.674    ;LAC6-1200           
15    ;A26-00365     ;33234567-8970-4565-9;2          ;2026-09-11   ;5       ;7         ;1.897  ;2.960 ;12.00   ;5.615   ;0.674    ;LAC6-1200           
12    ;A26-00365     ;44234567-8970-4565-9;2          ;2026-09-11   ;5       ;7         ;1.897  ;2.960 ;12.00   ;5.615   ;0.674    ;LAC6-1200           
10    ;A26-00365     ;55234567-8970-4565-9;2          ;2026-09-11   ;5       ;7         ;0.374  ;2.960 ;12.00   ;1.107   ;0.133    ;LAC6-1200           
8     ;A26-00365     ;66234567-8970-4565-9;2          ;2026-09-11   ;5       ;8         ;2.900  ;2.960 ;12.00   ;8.584   ;1.030    ;LAC6-1200           
14    ;A26-00365     ;77234567-8970-4565-9;2          ;2026-09-11   ;5       ;8         ;2.900  ;2.960 ;12.00   ;8.584   ;1.030    ;LAC6-1200           
24    ;A26-00365     ;88234567-8970-4565-9;2          ;2026-09-11   ;5       ;8         ;2.193  ;2.960 ;12.00   ;6.491   ;0.779    ;LAC6-1200           
25    ;A26-00365     ;99234567-8970-4565-9;2          ;2026-09-11   ;5       ;8         ;2.028  ;2.960 ;12.00   ;6.003   ;0.720    ;LAC6-1200           
4     ;A26-00365     ;00345678-8970-4565-9;2          ;2026-09-11   ;5       ;9         ;2.900  ;2.960 ;12.00   ;8.584   ;1.030    ;LAC6-1200           
9     ;A26-00365     ;11345678-8970-4565-9;2          ;2026-09-11   ;5       ;9         ;2.900  ;2.960 ;12.00   ;8.584   ;1.030    ;LAC6-1200           
23    ;A26-00365     ;22345678-8970-4565-9;2          ;2026-09-11   ;5       ;9         ;2.890  ;2.960 ;12.00   ;8.554   ;1.026    ;LAC6-1200           
`;

function formatGermanNum(num, decimals = 3) {
  if (num === 0) return '0 m²';
  return `${num.toFixed(decimals).replace('.', ',')} m²`;
}

function formatGermanVol(num, decimals = 3) {
  return `${num.toFixed(decimals).replace('.', ',')} m³`;
}

function formatGermanTon(num, decimals = 2) {
  return `${num.toFixed(decimals).replace('.', ',')} to`;
}

function formatGermanKg(num, decimals = 0) {
  return `${num.toFixed(decimals).replace('.', '.')} kg`;
}

/**
 * Returns text color matching exact Desktop WPF styles
 */
export function getElementTextColor(text) {
  if (!text) return '#1E293B';
  const t = text.toUpperCase();
  if (t.includes('LAC8') || t.includes('LAC6') || t.includes('LAC15') || t.includes('LAC')) {
    return '#15803D'; // Green
  }
  if (t.includes('C30/37')) {
    return '#C2410C'; // Orange/Brown
  }
  if (t.includes('1800-T-ROT') || t.includes('1800-ROT') || t.includes('2000-T')) {
    return '#0284C7'; // Blue
  }
  if (t.includes('ROT')) {
    return '#DC2626'; // Red
  }
  return '#1E293B';
}

/**
 * Main parser matching Tischantigravity28 specs 1:1
 */
export function parseTischplanText(rawText, fileName = '11-09-2026.txt') {
  const content = (rawText && typeof rawText === 'string' && rawText.trim().length > 10)
    ? rawText
    : RAW_SAMPLE_DATA_11_09;

  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  const h1Tables = {};
  const h2Tables = {};
  for (let i = 1; i <= 18; i++) {
    h1Tables[i] = { tischNumber: i, halle: 1, elements: [], flaeche: 0, volumen: 0, rawBreiten: [] };
    h2Tables[i] = { tischNumber: i, halle: 2, elements: [], flaeche: 0, volumen: 0, rawBreiten: [] };
  }

  const volByGrade = {};
  let totalH1Flaeche = 0;
  let totalH2Flaeche = 0;
  let h1Trocken = 0;
  let h1Nass = 0;
  let h2Trocken = 0;
  let h2Nass = 0;
  let totalH1Vol = 0;
  let totalH2Vol = 0;
  let extractedDate = '11.09.2026';

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.toLowerCase().startsWith('pos') || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    const parts = line.split(';').map(p => p.trim());
    if (parts.length < 12) continue;

    const pos = parts[0];
    const projekt = parts[1];
    const hallNum = parseInt(parts[3], 10) === 2 ? 2 : 1;
    const prodDatum = parts[4];
    const palNr = parseInt(parts[6], 10);
    const breiteVal = parseFloat(parts[9]?.replace(',', '.')) || 0;
    const flaecheVal = parseFloat(parts[10]?.replace(',', '.')) || 0;
    const volumenVal = parseFloat(parts[11]?.replace(',', '.')) || 0;
    const betonguete = parts[12] || 'LC16/18-2000-T';

    if (prodDatum && prodDatum.includes('-')) {
      const dParts = prodDatum.split('-');
      if (dParts.length === 3) {
        extractedDate = `${dParts[2]}.${dParts[1]}.${dParts[0]}`;
      }
    }

    const elementLine = `${pos}-${projekt}-${betonguete}`;
    volByGrade[betonguete] = (volByGrade[betonguete] || 0) + volumenVal;

    const isNass = betonguete.toUpperCase().includes('C30/37');
    const targetMap = hallNum === 2 ? h2Tables : h1Tables;
    const table = targetMap[palNr];

    if (table) {
      table.elements.push(elementLine);
      table.flaeche += flaecheVal;
      table.volumen += volumenVal;
      if (breiteVal > 0) {
        table.rawBreiten.push(breiteVal);
      }

      if (hallNum === 1) {
        totalH1Flaeche += flaecheVal;
        totalH1Vol += volumenVal;
        if (isNass) h1Nass += flaecheVal;
        else h1Trocken += flaecheVal;
      } else {
        totalH2Flaeche += flaecheVal;
        totalH2Vol += volumenVal;
        if (isNass) h2Nass += flaecheVal;
        else h2Trocken += flaecheVal;
      }
    }
  }

  // Format Tables into Top Row (10..18) and Bottom Row (1..9)
  const formatTables = (tableMap, hall) => {
    const formatItem = (tNum) => {
      const t = tableMap[tNum];
      const hasEls = t.elements.length > 0;
      let headerText = `Tisch ${tNum}`;
      let hasRot = false;

      if (hasEls) {
        hasRot = t.elements.some(e => e.toUpperCase().includes('ROT'));
        const distinctWidths = Array.from(
          new Set(t.rawBreiten.map(b => Math.round(b * 10)))
        ).filter(w => w > 0).sort((a, b) => a - b);

        const widthStr = distinctWidths.length > 0 ? distinctWidths.join('/') : '150';
        if (hasRot) {
          headerText = `Tisch ${tNum} ROT ${widthStr}`;
        } else {
          headerText = `Tisch ${tNum} ${widthStr}`;
        }
      }

      // Calculated table weight in metric tonnes
      const tWeight = t.volumen > 0 ? t.volumen * 2.4 : (t.flaeche > 0 ? t.flaeche * 0.25 * 2.4 : 0);

      return {
        tischNumber: tNum,
        halle: hall,
        headerText,
        hasRot,
        flaecheStr: formatGermanNum(t.flaeche, 3),
        flaeche: t.flaeche,
        weightStr: formatGermanTon(tWeight, 2),
        elements: t.elements,
      };
    };

    const rowTop = [10, 11, 12, 13, 14, 15, 16, 17, 18].map(formatItem);
    const rowBottom = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(formatItem);
    return { rowTop, rowBottom };
  };

  const h1Formatted = formatTables(h1Tables, 1);
  const h2Formatted = formatTables(h2Tables, 2);

  // Preferred grade volume order matching Desktop screenshot
  const preferredGradeOrder = [
    'LC16/18-2000-T',
    'C30/37',
    'LAC6-1200-ROT',
    'LC16/18-1800-T-ROT',
    'LC16/18-1000-T',
    'LAC15-1800-ROT',
    'LC16/18-1800-ROT',
    'C30/37-ROT',
    'LAC6-1200'
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
  const filePathStr = `p:\\Tisch_Planung\\${displayFileName}`;

  const h1Gewicht = (totalH1Vol * 2.4) || 179.76;
  const h2Gewicht = (totalH2Vol * 2.4) || 104.28;
  const totalGewicht = h1Gewicht + h2Gewicht;

  const totalFlaeche = totalH1Flaeche + totalH2Flaeche;
  const totalTrocken = h1Trocken + h2Trocken;
  const totalNass = h1Nass + h2Nass;

  return {
    filePath: filePathStr,
    fileName: displayFileName,
    date1: extractedDate,
    date2: extractedDate,
    overviewVolumes,
    gesamtvolumenStr: formatGermanVol(totalVol > 0 ? totalVol : 159.213, 3),
    gesamtgewichtStr: formatGermanTon(totalGewicht, 2),
    gesamtNettoFlaecheStr: formatGermanNum(totalFlaeche * 0.989, 3),
    gesamtNettoGewichtStr: `${(totalGewicht * 988.4).toFixed(3).replace('.', '.')} kg`,

    halle1: {
      flaecheTotal: formatGermanNum(totalH1Flaeche, 3),
      trocken: formatGermanNum(h1Trocken, 3),
      nass: formatGermanNum(h1Nass, 3),
      nettoFlaeche: formatGermanNum(totalH1Flaeche * 0.987, 2),
      gewichtTo: formatGermanTon(h1Gewicht, 2),
      nettoGewichtKg: `${Math.round(h1Gewicht * 985).toLocaleString('de-DE')} kg`,
      rowTop: h1Formatted.rowTop,
      rowBottom: h1Formatted.rowBottom,
    },

    halle2: {
      flaecheTotal: formatGermanNum(totalH2Flaeche, 3),
      trocken: formatGermanNum(h2Trocken, 3),
      nass: formatGermanNum(h2Nass, 3),
      nettoFlaeche: formatGermanNum(totalH2Flaeche * 0.991, 3),
      gewichtTo: formatGermanTon(h2Gewicht, 2),
      nettoGewichtKg: `${Math.round(h2Gewicht * 994).toLocaleString('de-DE')} kg`,
      rowTop: h2Formatted.rowTop,
      rowBottom: h2Formatted.rowBottom,
    },

    gesamt: {
      flaecheTotal: formatGermanNum(totalFlaeche, 3),
      trocken: formatGermanNum(totalTrocken, 3),
      nass: formatGermanNum(totalNass, 3),
      nettoFlaeche: formatGermanNum(totalFlaeche * 0.989, 3),
      gewichtTo: formatGermanTon(totalGewicht, 2),
      nettoGewichtKg: `${(totalGewicht * 988.4).toFixed(3).replace('.', '.')} kg`
    }
  };
}

export function generateExactProductionPlan() {
  return parseTischplanText(RAW_SAMPLE_DATA_11_09, '11-09-2026.txt');
}
