*Internal notes: Bu repo npm paketi olarak paketlenip internal registry e aktarılacak ve controllera dependency olarak atanacak. 

!! Keycloak entegrasyonu !!

1. Yaml api version güncellemesi:
iofog.org/v1 or iofog.org/v2 to datasance.com/v1

güncelleme olacak kaynaklar:
/src/Catalog/Application/index.js
/src/Catalog/Microservice/index.js
/src/ECNViewer/ApplicationDetails/index.js
/src/Utils/constants.js

2. favicon, svg ve logoların datasance favicon ve logoları ile güncellenmesi

3. Arayüz ve harita renk plateinin datasance renk paletiyle güncellenmesi

4. Mikroservis PORTS tablosunda public port açılmış ve link aktif olmuş olmasına rağmen PUBLICLINK kolonu boş geliyor

5. Edgeworx trademark ifadeleri ve edgeworx github ve web url linkleri datasance ile güncellenecek
/package.json
/package.sh
/package/package.json
/scripts/utils.sh
/server/index.js
/server/package.json

6. Sol ekran panelinin ortasındaki sekmede yer alan catalog panelinde sadece application templateler gözüküyor. Kaynak dosyalar arasında microservice cataloglarıda yer alıyor fakat arayüzde gözükmüyor. Aynı sekme içerisinde veya panelde bir alt sekmede gözükecek şekilde katalog mikroservisleride arayüze eklenecek

7. Ekranın en altında bulunan contoller, ECN version ve Elipse Foundation trade mark güncellenecek. Ayrıca oaraya 3 yeni yönlendirme linki eklenecek:
    DOCS: docs.datasance.com
    API: 
    Support: subscription ve entiltement check yapacak ve ok se support ticket form ekranına yönlendirecek. * Bu konu ilk etapta geçici olarak ele alınabilir, ama ilerleyen dönemde ticket açarken log dosyalarının otomatik olarak eklenmesi vs düşünülebilir. 

8. Anasayfada çıkan ECN bilgilendirme tablosu darcy.cloud ekranında yer alan ayar düğmesiyle daraltılıp genişletilebilecek. darcy.cloud arayüzü birlikte incelenip gözlemler yapıalcak.. center map!

9. Apllication ekrarnı route tablosunda gözüken mikroservislerin koştuğu edgelar arasında harita üzerinde mash oluşturalacak.

10. Multi controller clusterlarda, ECN viewerda tüm controllerların gösterilmesi.

PS: Madde Madde 1-7 IETT ilk kuruluma yetiştirilmesi hedeflenen öncelikli maddeler!

cihaz sağlık ve uyarı alarm oluşturma ekranı
