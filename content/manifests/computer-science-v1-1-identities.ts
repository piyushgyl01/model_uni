import { computerScienceCourseSpecsV1_1 } from "../programs/computer-science-course-specs-v1-1";
import { computerScienceIdentities } from "./computer-science-identities";

/**
 * Identity replacements introduced by the Computer Science 1.1 publication.
 *
 * Keys are immutable 1.0 identities. Values are newly assigned, literal
 * type-prefixed UUIDv7 identities. Stable entities that remain byte-equivalent
 * are intentionally absent and continue to use their 1.0 identities.
 */
const computerScienceV11DirectIdentityReplacements = {
  "bnd_019fab2b-c400-7b9d-97af-bf35dad278eb": "bnd_019fbc95-32a7-7901-bff2-8d4be908e541",
  "prv_019fab2b-c402-7cc7-b8a3-68801ab53820": "prv_019fbc95-32a8-7adf-8823-425d90e4bc3d",
  "prvdc_019fab2b-c403-73c1-9cea-c71f42d574ca": "prvdc_019fbc95-32a9-777b-bcca-57c8e77bde5c",
  "sch_019fab2b-c42f-7432-b8d9-7055def890f3": "sch_019fbc95-32aa-7785-8bd5-252e4daca2a2",
  "cpm_019fab2b-c41e-798c-aee7-5a959d3a4147": "cpm_019fbc95-32ab-773b-8f03-592ef726359c",
  "cpm_019fab2b-c41f-71d9-a669-1b5916ec91f4": "cpm_019fbc95-32ac-728a-9b16-cb8cd83a4d55",
  "cpm_019fab2b-c420-78ea-8461-7856fe29ef90": "cpm_019fbc95-32ad-7d61-a9e0-c48cb4594fdf",
  "cpm_019fab2b-c421-7dfa-aae6-52f15da9c009": "cpm_019fbc95-32ae-7dc9-8101-a8357e6a47e0",
  "cpm_019fab2b-c422-71d8-a4e7-e00705251f4e": "cpm_019fbc95-32af-7df0-bd46-fb27ecde5244",
  "cpm_019fab2b-c423-7996-906f-1e04d31955c5": "cpm_019fbc95-32b0-7177-89e2-de0d1847532f",
  "cpm_019fab2b-c424-7aec-9621-5a7b18a5a581": "cpm_019fbc95-32b1-7859-92f7-f4dee5407d15",
  "cpm_019fab2b-c425-78e2-b46f-1ae1f8f6244d": "cpm_019fbc95-32b2-755f-beb7-c5c36bffcd96",
  "cpm_019fab2b-c426-7269-b78b-05007c0a2b2b": "cpm_019fbc95-32b3-7c5f-a051-6966bcdd2c98",
  "cpm_019fab2b-c427-7255-8470-d70d09114094": "cpm_019fbc95-32b4-74d7-b7ec-391caf41c8ef",
  "cpm_019fab2b-c428-7237-a7c6-6339d1c59cf8": "cpm_019fbc95-32b5-72d5-ae31-7e90a8a804dd",
  "cpm_019fab2b-c429-754d-b67d-4658105ab85f": "cpm_019fbc95-32b6-7350-9bd5-a385ad12babe",
  "cpm_019fab2b-c42a-723d-9a5c-6e4b619d921b": "cpm_019fbc95-32b7-78c5-af5f-ff9ac5a5229f",
  "cpm_019fab2b-c42b-7fff-971a-ace58c46b9b6": "cpm_019fbc95-32b8-719a-8cfb-f28eb9719a09",
  "cpm_019fab2b-c42c-7db5-9e14-e444e2d208e1": "cpm_019fbc95-32b9-72da-9828-31b70432e58d",
  "cpm_019fab2b-c42d-7777-8e75-72ae59c55de2": "cpm_019fbc95-32ba-7958-9103-7662561c7931",
  "req_019fab2b-c405-7312-a7d9-f572086bc6a2": "req_019fbc95-32bb-73db-ae62-5c7eee0f9ec6",
  "req_019fab2b-c406-708d-af43-876bd4300a88": "req_019fbc95-32bc-7a72-8e48-337cf129b706",
  "req_019fab2b-c407-7202-a14f-3887dbd0753f": "req_019fbc95-32bd-789d-8868-904d609f5e77",
  "req_019fab2b-c408-7a01-aa2a-f423cea02173": "req_019fbc95-32be-7c42-9294-3c88c499bb30",
  "req_019fab2b-c409-7544-9bfd-81b1f6e924c9": "req_019fbc95-32bf-7fe6-8710-4c6c4f5f7f71",
  "req_019fab2b-c40a-7678-9821-d4cd6824c9ba": "req_019fbc95-32c0-7214-ad7b-f9afdd251e09",
  "con_019fab2b-c40c-7176-b0ac-1c8e0e14b535": "con_019fbc95-32c1-798c-8403-a5478f1ad13a",
  "crv_019fab2b-c4d8-7295-8844-3dfa832240e8": "crv_019fbc95-32c2-71dc-a17e-be0bad984faf",
  "unt_019fab2b-c4d9-7d9e-aa4e-cbbbb37e9844": "unt_019fbc95-32c3-7c59-8f11-1ea49e585c80",
  "unt_019fab2b-c4da-7c84-92ae-b69a449095ff": "unt_019fbc95-32c4-7208-b605-f623c5b66c0e",
  "unt_019fab2b-c4db-7438-80f6-f3fd0881f536": "unt_019fbc95-32c5-7751-a57f-2cab4f1aa712",
  "unt_019fab2b-c4dc-7253-86cb-896a61794552": "unt_019fbc95-32c6-7085-b845-48fdcf045b5f",
  "unt_019fab2b-c4dd-7200-8eb5-8e9ee458d48b": "unt_019fbc95-32c7-7ee7-8744-7f6288163ad5",
  "unt_019fab2b-c4de-73c8-a8c4-af20565dbff6": "unt_019fbc95-32c8-7a6f-9c4f-3868e35deabb",
  "unt_019fab2b-c4df-799c-8342-877401d1a32e": "unt_019fbc95-32c9-7792-9d40-ef012c76cdaa",
  "unt_019fab2b-c4e0-7192-8009-22bb88e27f29": "unt_019fbc95-32ca-76cf-bace-72fcfdb07108",
  "asv_019fab2b-c4e3-74f0-b40d-2ec7007c35a0": "asv_019fbc95-32cb-781e-8e6d-2c48de6430f8",
  "asv_019fab2b-c4e4-707e-862b-36b6f4cd7c5f": "asv_019fbc95-32cc-76ac-a1b7-1f027cfb6e5a",
  "res_019fab2b-c4e5-77f1-9db1-dfa6a38690a9": "res_019fbc95-32cd-7a5b-b4e7-b0dc86848bd6",
  "rsv_019fab2b-c4e6-78fe-acae-5c19591ef1df": "rsv_019fbc95-32ce-7a4b-9b66-c60ac8511c5b",
  "acc_019fab2b-c4e7-77aa-b6fe-c4f46152c9da": "acc_019fbc95-32cf-78ba-9f94-0ac1899d5a6e",
  "rgt_019fab2b-c4e8-7eef-813e-3f729df2841b": "rgt_019fbc95-32d0-7060-90af-5826e719e517",
  "frs_019fab2b-c4e9-7357-b188-b32a828ff005": "frs_019fbc95-32d1-7fe0-9886-73d3f5da4500",
  "prvdc_019fab2b-c4ea-7c69-9132-e971ce9f99a1": "prvdc_019fbc95-32d2-7775-8a7d-f3dfe5154e66",
  "opt_019fab2b-c4eb-7955-a323-1ca5b9e0b84a": "opt_019fbc95-32d3-7ce5-921b-84ae1fd645b1",
  "plc_019fab2b-c4ec-7ab6-ad8f-d40676419f4b": "plc_019fbc95-32d4-7e72-aa28-54b704ffa472",
  "cpm_019fab2b-c4ed-7f2c-9f03-4fa50d58dd97": "cpm_019fbc95-32d5-79bf-bfae-2632fc68a137",
  "cpm_019fab2b-c4ee-7fa7-a266-2326d61f628a": "cpm_019fbc95-32d6-7c83-ae1a-450b8f8ee3e2",
  "crv_019fab2b-c53b-7cc0-aaec-dc5cd7d08bf3": "crv_019fbc95-32d7-7f04-a6f3-edacf1b0c332",
  "unt_019fab2b-c53c-72a3-a5a1-9a74ab282aa2": "unt_019fbc95-32d8-7d0e-8455-0e6b387e1e70",
  "unt_019fab2b-c53d-7b89-b7b6-3d5d66db3213": "unt_019fbc95-32d9-744f-b02c-b5b170b0c0fb",
  "unt_019fab2b-c53e-74f9-be6b-aaedfc781b57": "unt_019fbc95-32da-7625-a727-506d81d87e4c",
  "unt_019fab2b-c53f-7051-b301-6556dbf2c090": "unt_019fbc95-32db-7511-8b34-9dd3664e50aa",
  "unt_019fab2b-c540-7318-bccb-0fd71b93dfb2": "unt_019fbc95-32dc-7a4d-a5e5-b0c409b4723a",
  "unt_019fab2b-c541-777f-b185-ae7863cec5d9": "unt_019fbc95-32dd-7cdb-8781-c997ddb9f28f",
  "unt_019fab2b-c542-724e-ac3a-4dfb45da2156": "unt_019fbc95-32de-7e4c-a5c2-c978dd2adbee",
  "unt_019fab2b-c543-7f83-a16f-c1a3064071e9": "unt_019fbc95-32df-7ee9-8347-26976b122f50",
  "asv_019fab2b-c546-749e-95af-713ed81d6d31": "asv_019fbc95-32e0-7e0c-b41d-394db20e5d76",
  "asv_019fab2b-c547-7819-8d41-9243ffcabda1": "asv_019fbc95-32e1-772e-8e47-0358330d32cd",
  "res_019fab2b-c548-75d0-af81-d4a71119e567": "res_019fbc95-32e2-78c3-9cf5-69bc495138b4",
  "rsv_019fab2b-c549-7686-8955-8b7de436eca4": "rsv_019fbc95-32e3-70de-9649-b9f5d394fa9e",
  "acc_019fab2b-c54a-7d22-b0e3-d6f7f1161ba4": "acc_019fbc95-32e4-7824-8586-5deb63ef5b34",
  "rgt_019fab2b-c54b-7a09-88de-47978d53aa08": "rgt_019fbc95-32e5-7fbd-a0ed-7b2410f240de",
  "frs_019fab2b-c54c-7b1d-91f2-16084b1cf6b4": "frs_019fbc95-32e6-768b-954b-316bc5d4785f",
  "prvdc_019fab2b-c54d-7561-a3ae-5c26bde95aa2": "prvdc_019fbc95-32e7-7425-aeec-3b0c0b95429e",
  "opt_019fab2b-c54e-76d9-88e7-62c9dbe70f5c": "opt_019fbc95-32e8-794b-be80-588601feb723",
  "plc_019fab2b-c54f-7249-a927-a1c7fca05686": "plc_019fbc95-32e9-7773-964e-29716770ad90",
  "cpm_019fab2b-c550-73e6-9bf9-ae56e43c1e2b": "cpm_019fbc95-32ea-7157-b05c-565832cbff7a",
  "cpm_019fab2b-c551-77ce-aa17-09c5fa449e49": "cpm_019fbc95-32eb-700c-9346-d6c6a6ef0c47",
  "cpm_019fab2b-c552-7249-aec4-b53252197786": "cpm_019fbc95-32ec-79f9-9d96-720f99aa9b2f",
  "crv_019fab2b-c5d1-7858-bbb2-2710aae96665": "crv_019fbc95-32ed-72b0-a568-a65a59ec7a26",
  "unt_019fab2b-c5d2-7549-a605-67a6dcf67b1d": "unt_019fbc95-32ee-7c36-8cce-ddeb8e1ae0f6",
  "unt_019fab2b-c5d3-71d9-93ef-ad7421c36130": "unt_019fbc95-32ef-72ec-b0aa-b9948f2644ea",
  "unt_019fab2b-c5d4-7d15-9e0c-338eaf44478c": "unt_019fbc95-32f0-74f3-8526-b23e0111a04e",
  "unt_019fab2b-c5d5-7ef8-9ea8-a215670afa31": "unt_019fbc95-32f1-72b6-ac6a-2f2cb1ed417d",
  "unt_019fab2b-c5d6-7d59-99f4-7796e038339a": "unt_019fbc95-32f2-713d-9034-a7b15bc21056",
  "unt_019fab2b-c5d7-7524-ae61-a0eb988d9903": "unt_019fbc95-32f3-76ec-b310-fb7f0c5ae69a",
  "unt_019fab2b-c5d8-7560-b2c1-c7bfa239b4e1": "unt_019fbc95-32f4-7d94-a121-dc056e35c919",
  "unt_019fab2b-c5d9-7cab-b3ee-22b04597e8b0": "unt_019fbc95-32f5-7ae4-8bf9-d58fa34d26c1",
  "asv_019fab2b-c5dc-71a7-8a8f-5e86421fd6e5": "asv_019fbc95-32f6-7493-b3e9-f8fdbe09392e",
  "asv_019fab2b-c5dd-76b6-acaa-41d032ba6c1e": "asv_019fbc95-32f7-7bef-866d-b5df77b6113e",
  "rsv_019fab2b-c5df-7378-8539-ac90de426557": "rsv_019fbc95-32f8-759d-a31f-49410c92c46c",
  "acc_019fab2b-c5e0-71e3-8466-acb91467b44c": "acc_019fbc95-32f9-7566-866e-b6b95f83cf75",
  "rgt_019fab2b-c5e1-78a4-ac27-e67be9e1954f": "rgt_019fbc95-32fa-7faa-9535-d619a3d05093",
  "frs_019fab2b-c5e2-7ff8-b8cd-826cae530100": "frs_019fbc95-32fb-7130-a83c-d90d9051e037",
  "prvdc_019fab2b-c5e3-7d14-a1e7-20dcda6e51c7": "prvdc_019fbc95-32fc-77c2-ad65-4a5532a1db31",
  "opt_019fab2b-c5e4-70bb-b816-78f7f61e62cc": "opt_019fbc95-32fd-7cab-ab5c-59a9e63e0e58",
  "plc_019fab2b-c5e5-7fb9-9fad-f86a7020c9ac": "plc_019fbc95-32fe-79e5-bc3a-5099ddae0a8d",
  "cpm_019fab2b-c5e6-7481-9001-306b58a70ddc": "cpm_019fbc95-32ff-784b-a4a3-478864b89d3e",
  "cpm_019fab2b-c5e7-776d-b68b-d83474ccd391": "cpm_019fbc95-3300-71b1-88db-26e0543731b1",
  "cpm_019fab2b-c5e8-7f3b-9227-75e3c58bc3e3": "cpm_019fbc95-3301-72b3-be57-ee4b80250c6e",
  "crv_019fab2b-c5ea-7f9b-ab16-b79ffe3ae502": "crv_019fbc95-3302-7772-b6ae-278012e5788c",
  "unt_019fab2b-c5eb-7c7b-be4b-ccc09dd5a09d": "unt_019fbc95-3303-737a-a1cf-ff5a66500634",
  "unt_019fab2b-c5ec-7918-a19c-218a8f47e145": "unt_019fbc95-3304-745d-acfc-a3df43c77cc1",
  "unt_019fab2b-c5ed-7df2-bb5a-d7de2d659ddb": "unt_019fbc95-3305-7b14-ad6e-24bdaeae470d",
  "unt_019fab2b-c5ee-7c13-b590-f60111aa51b0": "unt_019fbc95-3306-77b9-b72d-c0eb646f27b1",
  "unt_019fab2b-c5ef-7b79-8e4d-599182110516": "unt_019fbc95-3307-77fb-bc67-1e650aef52d1",
  "unt_019fab2b-c5f0-77ff-a30e-f41c30999c0d": "unt_019fbc95-3308-7ad5-b82c-f42aad8fab91",
  "unt_019fab2b-c5f1-7303-8e10-b4bf2873e797": "unt_019fbc95-3309-72f9-b3d1-0bfa367426c6",
  "unt_019fab2b-c5f2-7d9f-851a-b86f6bb104f3": "unt_019fbc95-330a-747d-a959-c819e9bcf121",
  "asv_019fab2b-c5f5-77cd-898c-38ce02c928d0": "asv_019fbc95-330b-714a-84ea-d2d8a10d2258",
  "asv_019fab2b-c5f6-7958-8cb3-75cc7ecbc28d": "asv_019fbc95-330c-7415-98a2-b241fc68fa81",
  "rsv_019fab2b-c5f8-7d8f-8514-1641ec32eb4a": "rsv_019fbc95-330d-7f67-864c-5690196edd02",
  "acc_019fab2b-c5f9-7eab-bf6d-b940e0622e42": "acc_019fbc95-330e-747a-927d-9694d7d49684",
  "rgt_019fab2b-c5fa-7e70-94a5-512546d62c9a": "rgt_019fbc95-330f-78fd-aefc-e94f597ae577",
  "frs_019fab2b-c5fb-7083-a177-f1ccba24d8b5": "frs_019fbc95-3310-7373-9101-3593e9c2d7ac",
  "prvdc_019fab2b-c5fc-7771-8f74-09d1f721df7b": "prvdc_019fbc95-3311-7712-9036-3d2a7adcd39c",
  "opt_019fab2b-c5fd-7338-b778-95d3a00abb59": "opt_019fbc95-3312-796e-9c25-efbe6a9b6f22",
  "plc_019fab2b-c5fe-74d6-a302-4d5e4f912d85": "plc_019fbc95-3313-7248-a745-c318836da7b0",
  "cpm_019fab2b-c5ff-7701-b45f-9044bc509ef0": "cpm_019fbc95-3314-7953-92eb-a6c289f5ceba",
  "cpm_019fab2b-c600-7f8b-a553-479446fb2d41": "cpm_019fbc95-3315-72cb-87a8-6f8102f00bd2",
  "cpm_019fab2b-c601-79ab-8321-4d83a995f5ca": "cpm_019fbc95-3316-7666-8c26-9bc047b32e3b",
  "cpm_019fab2b-c602-7fce-a5b1-129f0db0a552": "cpm_019fbc95-3317-7c45-b172-a1f8c4b2abfc",
  "crv_019fab2b-c64f-72de-89ae-1052c0390c8c": "crv_019fbc95-3318-7369-950e-1b70935c7ed7",
  "unt_019fab2b-c650-739d-a159-a3799321f3c6": "unt_019fbc95-3319-71d7-a075-86a3359e8c2d",
  "unt_019fab2b-c651-7fec-82f6-1c07f59ef273": "unt_019fbc95-331a-7a57-9344-0150ab2de97c",
  "unt_019fab2b-c652-72bd-a427-00cc6cd83bca": "unt_019fbc95-331b-76b6-b307-ce6b77a5d09d",
  "unt_019fab2b-c653-7356-8072-66ec9ffaa8b6": "unt_019fbc95-331c-7803-82f9-c6d254256344",
  "unt_019fab2b-c654-7695-86a5-eb75a5914f3b": "unt_019fbc95-331d-77e7-8188-6f9f43a8f596",
  "unt_019fab2b-c655-7269-9516-2409a263a67f": "unt_019fbc95-331e-726e-abc5-917b4d15ce39",
  "unt_019fab2b-c656-7c1d-ac9c-af62e267b6da": "unt_019fbc95-331f-7a09-8dbc-54c8d1cf4eba",
  "unt_019fab2b-c657-78bd-802a-f78fbfca58d6": "unt_019fbc95-3320-768e-808f-53bda0a72b9d",
  "asv_019fab2b-c65a-7436-874b-2635a5480d29": "asv_019fbc95-3321-7844-9f17-967f3ab99821",
  "asv_019fab2b-c65b-7278-81a9-fb42b8eaedab": "asv_019fbc95-3322-7cea-931d-490ad0b23540",
  "res_019fab2b-c65c-7a84-8626-fb02840fd48d": "res_019fbc95-3323-7fd8-ad40-bccfa7bcb293",
  "rsv_019fab2b-c65d-78b3-80cb-b6be6b0b3af1": "rsv_019fbc95-3324-7023-b94e-d32a37f91f2b",
  "acc_019fab2b-c65e-770f-82c7-c5118ac28ef1": "acc_019fbc95-3325-7a45-be18-4c04c0466148",
  "rgt_019fab2b-c65f-7828-8f28-f71083d931a1": "rgt_019fbc95-3326-7a18-9108-434a78b110d5",
  "frs_019fab2b-c660-7453-8abe-1066b70c1d3f": "frs_019fbc95-3327-758f-8a6b-2e7dca72537a",
  "prvdc_019fab2b-c661-7c36-8d1b-8027d8d84225": "prvdc_019fbc95-3328-79fe-a459-bf98b9541f88",
  "opt_019fab2b-c662-7a3f-bfd0-e4c93cc426b6": "opt_019fbc95-3329-793d-9e22-7952b9190db1",
  "plc_019fab2b-c663-7830-8b61-8f2c7c82c769": "plc_019fbc95-332a-7845-8a9e-0577c4a0fa3e",
  "cpm_019fab2b-c664-73bc-9ae2-a68cd8d7d684": "cpm_019fbc95-332b-77b3-b66b-638d3834f10f",
  "cpm_019fab2b-c665-7d0b-adb4-6180e4f529c6": "cpm_019fbc95-332c-7f86-96b0-79b91aca2c39",
  "cpm_019fab2b-c666-7fd1-bc13-e8edf661612e": "cpm_019fbc95-332d-7839-b8ee-69066bec1f53",
  "cpm_019fab2b-c667-7995-b0e9-2dd4568c1510": "cpm_019fbc95-332e-7133-81d4-bfe7debb639e",
  "crv_019fab2b-c751-7062-b30a-86a2d246c2af": "crv_019fbc95-332f-7edd-a04b-d5fd418aea38",
  "unt_019fab2b-c752-70bd-8aa7-7fb65821d26b": "unt_019fbc95-3330-7aa0-93b8-fdf55b3ee674",
  "unt_019fab2b-c753-7cb6-b60c-86e7bd451282": "unt_019fbc95-3331-76cc-99e9-4dc0fad9bb6e",
  "unt_019fab2b-c754-74ca-9ae1-73eeed7a4752": "unt_019fbc95-3332-7d7f-94da-15a7ef134331",
  "unt_019fab2b-c755-7360-a1e1-d813b91e87f8": "unt_019fbc95-3333-7450-ab30-7a7da5f4e2c0",
  "unt_019fab2b-c756-7165-9268-7ff876b123ee": "unt_019fbc95-3334-7305-b0f1-7b79e4806ca7",
  "unt_019fab2b-c757-7188-8924-564c4b797e66": "unt_019fbc95-3335-7a1f-8231-6702b266b88f",
  "unt_019fab2b-c758-7eb7-ba41-74b138e64f47": "unt_019fbc95-3336-714d-8b29-71c133486093",
  "unt_019fab2b-c759-7d96-99aa-eb6b66b3e596": "unt_019fbc95-3337-75b9-9c0e-6af5e42c5ecc",
  "asv_019fab2b-c75c-73e5-9f67-3065ee9f5790": "asv_019fbc95-3338-7d04-b399-338b3f3bf020",
  "asv_019fab2b-c75d-7972-a4f3-eea11bad9cba": "asv_019fbc95-3339-725f-9cf8-8750ab6df487",
  "res_019fab2b-c75e-79cb-8f09-cda61502cd1a": "res_019fbc95-333a-7184-8c95-696477349592",
  "rsv_019fab2b-c75f-7dd2-942c-3e075ea9c5e9": "rsv_019fbc95-333b-79cc-b344-37f8d68ca16b",
  "acc_019fab2b-c760-7b9f-9357-2ad2d7f61604": "acc_019fbc95-333c-7800-895e-690d4bbd74b7",
  "rgt_019fab2b-c761-70b1-aa76-5e93ebfc738c": "rgt_019fbc95-333d-727a-b5c6-e5131e6d5f34",
  "frs_019fab2b-c762-7d4b-8a3a-03f8c5c02743": "frs_019fbc95-333e-799f-a3f0-5403a4df5cc3",
  "prvdc_019fab2b-c763-7648-963b-4d0343350bfb": "prvdc_019fbc95-333f-72f9-b642-090d07943837",
  "opt_019fab2b-c764-714d-a05a-b8f53aaf489c": "opt_019fbc95-3340-7b2f-98bd-5f2fc6c209e3",
  "plc_019fab2b-c765-7ace-a45c-9fb49a155a7b": "plc_019fbc95-3341-73dc-8808-c65dbe5b9634",
  "cpm_019fab2b-c766-7385-88ac-55c1a464b456": "cpm_019fbc95-3342-72bc-bbcb-8b550cb5a056",
  "cpm_019fab2b-c767-77e8-b254-7a1d0ae70348": "cpm_019fbc95-3343-76e5-afb5-bc079132e050",
  "cpm_019fab2b-c768-7c88-bffd-5f672dc41004": "cpm_019fbc95-3344-7c93-89b9-c6645573560d",
  "opt_019fab2b-c599-78dc-9c22-20c541f6ef21": "opt_019fbc95-3345-7de1-aff8-aede2ce54e4a",
  "plc_019fab2b-c59a-7bda-a758-e16956af1566": "plc_019fbc95-3346-7ae6-b498-a70b273c54f2",
  "opt_019fab2b-c796-7b11-b554-8dd5d2f75bfc": "opt_019fbc95-3347-7b38-9e71-1019668ac17c",
} as const satisfies Readonly<Record<string, string>>;

/**
 * Republished dependants in the transitive prerequisite closure. Their course
 * content is unchanged, but each version must pin the new prerequisite-version
 * graph rather than mutate its immutable 1.0 record.
 */
const computerScienceV11PrerequisiteClosureIdentityReplacements = {
  "con_019fab2b-c40b-71ef-b3f1-ddec39366c85": "con_019fbc9b-e529-7510-a642-b472e497a401",
  "con_019fab2b-c40d-7fb5-97d2-4a11041afb35": "con_019fbc9b-e52a-7388-9342-ba906cdad455",
  "crv_019fab2b-c554-7420-a790-10939214a9a6": "crv_019fbc9b-e52b-703a-aef1-dfabb782702f",
  "unt_019fab2b-c555-7e76-8268-b9cd03625413": "unt_019fbc9b-e52c-7ed0-8858-99f7d94cf04f",
  "unt_019fab2b-c556-7c44-9b1b-6a3d8f60a5ca": "unt_019fbc9b-e52d-784f-9540-6b67321b8734",
  "unt_019fab2b-c557-7093-b8ec-2ba2d67eb14f": "unt_019fbc9b-e52e-7751-8602-445cf11b6aa2",
  "unt_019fab2b-c558-764d-9f8d-2617d549862b": "unt_019fbc9b-e52f-78f7-873a-5b871581e3e0",
  "unt_019fab2b-c559-7115-8999-3a05d1a85691": "unt_019fbc9b-e530-764b-8e4e-32deb76a20f9",
  "unt_019fab2b-c55a-7b3d-928f-4b26ef9ecae7": "unt_019fbc9b-e531-76ad-8d53-35174869904d",
  "unt_019fab2b-c55b-71ad-943c-404e762487fc": "unt_019fbc9b-e532-77b7-9999-b00f7695502d",
  "unt_019fab2b-c55c-78a2-98b2-73e7feb5b119": "unt_019fbc9b-e533-7289-a45a-227aafde0c9a",
  "asv_019fab2b-c55f-747c-9f16-b6e5e3b34171": "asv_019fbc9b-e534-7475-ba5f-a5e91bfb5e41",
  "asv_019fab2b-c560-7689-911c-6f04c6ec9ac0": "asv_019fbc9b-e535-79b9-88c8-6ac1628d6eb8",
  "rsv_019fab2b-c562-771e-8b2d-669cec5aca68": "rsv_019fbc9b-e536-7575-bdc2-077ad45ae7eb",
  "acc_019fab2b-c563-79ea-94dd-8e6b64847708": "acc_019fbc9b-e537-7afd-b4c0-2b4e51e62a06",
  "rgt_019fab2b-c564-7174-badf-ec7d6d1a429f": "rgt_019fbc9b-e538-7b32-a576-f135b78f91ce",
  "frs_019fab2b-c565-77c6-be2d-3aaaf9c75193": "frs_019fbc9b-e539-70f5-bd30-039ac0e4b4a8",
  "prvdc_019fab2b-c566-7f83-ae2b-8c215f870e48": "prvdc_019fbc9b-e53a-7796-9343-e03c826f42e4",
  "opt_019fab2b-c567-7e6f-a899-0993c79b29d8": "opt_019fbc9b-e53b-7c89-91f2-d2e122c3ba02",
  "plc_019fab2b-c568-7af7-9f2f-810c5239c064": "plc_019fbc9b-e53c-76f3-b9a1-7227872f4562",
  "cpm_019fab2b-c569-7d85-a6de-66af54a7baf2": "cpm_019fbc9b-e53d-740b-b726-5e9930ed06e3",
  "cpm_019fab2b-c56a-742d-b0cd-409c6fac5f8a": "cpm_019fbc9b-e53e-794b-b513-0450f610126d",
  "cpm_019fab2b-c56b-73e8-80f1-6de886ea6252": "cpm_019fbc9b-e53f-772e-9149-7f2ef28e6dee",
  "crv_019fab2b-c5b8-718b-b71e-8ef7ddee038a": "crv_019fbc9b-e540-7425-9374-0955b2393349",
  "unt_019fab2b-c5b9-799a-9383-cd99e740a1eb": "unt_019fbc9b-e541-798a-8e40-d8d69f7f147f",
  "unt_019fab2b-c5ba-7f9a-9892-93914ef2e297": "unt_019fbc9b-e542-782a-b84c-914ada236f84",
  "unt_019fab2b-c5bb-7d66-89d7-4336de1a41e3": "unt_019fbc9b-e543-714e-829e-2d0ba8fe6539",
  "unt_019fab2b-c5bc-79ed-a559-2e7f97aa6b46": "unt_019fbc9b-e544-7812-a10a-c1ad3e1e963a",
  "unt_019fab2b-c5bd-7aa3-9e84-fde291ec41ac": "unt_019fbc9b-e545-7c7a-b2d9-2938e205eb09",
  "unt_019fab2b-c5be-707b-ae7a-ade07356f936": "unt_019fbc9b-e546-713c-bd6c-d4ca5c783f83",
  "unt_019fab2b-c5bf-7bfd-bf80-1b85019fbe20": "unt_019fbc9b-e547-7850-8351-e8c56e916e01",
  "unt_019fab2b-c5c0-7656-82dd-485703f66b3b": "unt_019fbc9b-e548-7179-ad6b-bc566271ccc2",
  "asv_019fab2b-c5c3-7f8c-b75d-a04ad777b523": "asv_019fbc9b-e549-7b1f-9dee-d1781f0ca858",
  "asv_019fab2b-c5c4-70b8-bb8d-46ca368a49cc": "asv_019fbc9b-e54a-7513-986e-e44c62e38ddd",
  "rsv_019fab2b-c5c6-7e8c-960f-fce20a6227f0": "rsv_019fbc9b-e54b-7bce-9da1-7a6e5db334bd",
  "acc_019fab2b-c5c7-70ce-8093-2affda1023e5": "acc_019fbc9b-e54c-788a-a8b4-f8ed692e0792",
  "rgt_019fab2b-c5c8-7592-8b2e-70ac35dee039": "rgt_019fbc9b-e54d-71dc-a54e-ca3fcab38874",
  "frs_019fab2b-c5c9-7226-bdd3-75ac9de30c46": "frs_019fbc9b-e54e-732b-a42e-3d118b8cee82",
  "prvdc_019fab2b-c5ca-76e9-8ce3-33602e8fbc42": "prvdc_019fbc9b-e54f-7c24-aa9f-20a6545224c1",
  "opt_019fab2b-c5cb-7c7d-94ed-dae68a10c289": "opt_019fbc9b-e550-7694-8964-d9c157bb081c",
  "plc_019fab2b-c5cc-702b-8633-9302148bbc1e": "plc_019fbc9b-e551-7a5e-8a06-83edfa4d26e4",
  "cpm_019fab2b-c5cd-75b1-a23c-252aaaa18748": "cpm_019fbc9b-e552-7bfa-b97d-8673f95458ac",
  "cpm_019fab2b-c5ce-72e0-af33-9e206245f6e4": "cpm_019fbc9b-e553-7dcc-ae27-af98b4ef2d71",
  "cpm_019fab2b-c5cf-79eb-92e3-14a19ff424f0": "cpm_019fbc9b-e554-7834-8a20-49ea387e6141",
  "crv_019fab2b-c604-7ee7-8af8-099c5f24fae0": "crv_019fbc9b-e555-7694-9418-b47083abeb96",
  "unt_019fab2b-c605-7960-b76c-64a102e50bb8": "unt_019fbc9b-e556-7718-8a65-db7c7de1e6cf",
  "unt_019fab2b-c606-7ade-86c6-9febee9273f5": "unt_019fbc9b-e557-7a71-ad0c-d4c5aed0fdf5",
  "unt_019fab2b-c607-7085-81c8-df728651ed02": "unt_019fbc9b-e558-774f-b961-b6833dc7137c",
  "unt_019fab2b-c608-7e1d-8727-6d2818c493ff": "unt_019fbc9b-e559-77ab-8b9d-d4c3b52ca6e9",
  "unt_019fab2b-c609-7625-9b16-bd0fbcdddb53": "unt_019fbc9b-e55a-7449-be46-9c436e3622e3",
  "unt_019fab2b-c60a-736b-ae66-a371c217ca3b": "unt_019fbc9b-e55b-7b59-9f89-342941a14e8a",
  "unt_019fab2b-c60b-7d30-8912-43c4e771e53e": "unt_019fbc9b-e55c-7822-85bb-8bcb32be0fde",
  "unt_019fab2b-c60c-704e-a520-babf5011b1e8": "unt_019fbc9b-e55d-7089-9135-d12fb4163fbe",
  "asv_019fab2b-c60f-7097-9dba-e4e208c345f2": "asv_019fbc9b-e55e-729b-bbf5-419256934704",
  "asv_019fab2b-c610-72c2-b051-0900718b082e": "asv_019fbc9b-e55f-7fdd-beff-a68be642d42c",
  "rsv_019fab2b-c612-7198-b0e1-95fe528c3697": "rsv_019fbc9b-e560-799c-bff9-ed520ee21c96",
  "acc_019fab2b-c613-7dcc-a5ee-bce3eff1aca2": "acc_019fbc9b-e561-7a55-8d86-3a3e49e6c714",
  "rgt_019fab2b-c614-7ea4-b308-b906b96012bc": "rgt_019fbc9b-e562-7444-88e5-8017052a4b04",
  "frs_019fab2b-c615-77df-960c-f45bce257602": "frs_019fbc9b-e563-7fbf-b89a-8bc2db710418",
  "prvdc_019fab2b-c616-7e27-833a-7ea747b7e1a4": "prvdc_019fbc9b-e564-78a7-baa4-628bbc4d4210",
  "opt_019fab2b-c617-712c-a91d-410ce07b9b02": "opt_019fbc9b-e565-70a1-9c3f-1cad7367b7ac",
  "plc_019fab2b-c618-7f3f-8a15-a9b1d8014da5": "plc_019fbc9b-e566-7a4d-8d7d-222378d42a8a",
  "cpm_019fab2b-c619-72aa-9766-f9bcb06e1979": "cpm_019fbc9b-e567-7806-91d6-3136b3b2e74e",
  "cpm_019fab2b-c61a-7a66-94cb-1ec4a1669ffc": "cpm_019fbc9b-e568-7aca-8803-38aa0b21bb42",
  "cpm_019fab2b-c61b-7b35-a8ea-d95ecf7cfa60": "cpm_019fbc9b-e569-7629-a081-cc86809b2a80",
  "crv_019fab2b-c636-7a47-bf45-19e4f638662f": "crv_019fbc9b-e56a-76cd-a5f7-1a5ea2e04aba",
  "unt_019fab2b-c637-7373-b872-ac5a563cbca5": "unt_019fbc9b-e56b-703c-8e7b-bcfab3d56014",
  "unt_019fab2b-c638-7a6d-9a98-33212816d112": "unt_019fbc9b-e56c-78e8-8cb0-5cbd68e781f0",
  "unt_019fab2b-c639-7c76-9a80-9859bd9ea717": "unt_019fbc9b-e56d-7f3b-b879-c7d53e5cf64e",
  "unt_019fab2b-c63a-789f-b7a2-6f36c2f45081": "unt_019fbc9b-e56e-7bfb-9a1c-6c55f9423be7",
  "unt_019fab2b-c63b-7b87-80ae-cda0d6bf5b2f": "unt_019fbc9b-e56f-7869-80d2-b1902e083263",
  "unt_019fab2b-c63c-76b4-8074-b8daf4b3e2ac": "unt_019fbc9b-e570-71bb-bd11-f153c69291a8",
  "unt_019fab2b-c63d-7180-bcde-df68562c37c8": "unt_019fbc9b-e571-7244-abd8-2b123ad8521a",
  "unt_019fab2b-c63e-78c0-8b76-080feae9138e": "unt_019fbc9b-e572-7440-8d94-0dc7635df509",
  "asv_019fab2b-c641-7f8a-b792-31fde210359d": "asv_019fbc9b-e573-76db-9ac8-8421774a43df",
  "asv_019fab2b-c642-7702-9783-3ea5eeebd839": "asv_019fbc9b-e574-76f6-b3c7-93468346d9b4",
  "rsv_019fab2b-c644-700e-9db0-b706e99f09ee": "rsv_019fbc9b-e575-77c1-a7d4-bdf4e48dc497",
  "acc_019fab2b-c645-72f1-9295-fbf17c9861fd": "acc_019fbc9b-e576-731e-8dbb-446b06852b61",
  "rgt_019fab2b-c646-7708-ade5-7451351413dd": "rgt_019fbc9b-e577-708a-a22f-b3fd208902a1",
  "frs_019fab2b-c647-736f-83fa-fd60fe0e5dc8": "frs_019fbc9b-e578-7a8c-8191-41363cdd009c",
  "prvdc_019fab2b-c648-752b-b3c5-89b4f310075f": "prvdc_019fbc9b-e579-7d64-855f-4e50e323e7ec",
  "opt_019fab2b-c649-7f2e-b1ad-e966816b59be": "opt_019fbc9b-e57a-7520-a0c0-00d5c17d0866",
  "plc_019fab2b-c64a-7530-ba10-6607208c7719": "plc_019fbc9b-e57b-7faa-9dee-87ac7418b51a",
  "cpm_019fab2b-c64b-7e03-8835-d1245c412ff7": "cpm_019fbc9b-e57c-7c06-8cbf-040388394eaf",
  "cpm_019fab2b-c64c-754a-b186-4de41add14b5": "cpm_019fbc9b-e57d-7ae3-afa7-6218827d9034",
  "cpm_019fab2b-c64d-73f2-b911-56790a382f77": "cpm_019fbc9b-e57e-7134-8854-266ac29a8c65",
  "crv_019fab2b-c669-7bd2-bfb7-5eb81cae8aa3": "crv_019fbc9b-e57f-785f-812b-84026d259ec3",
  "unt_019fab2b-c66a-7c65-88b9-32865763e06c": "unt_019fbc9b-e580-7de9-b4bf-b5257bba6f0d",
  "unt_019fab2b-c66b-77c0-9c6a-9db9ec5d663e": "unt_019fbc9b-e581-7cd5-8d26-5a647e411d86",
  "unt_019fab2b-c66c-77f0-b592-39f7d7ca6760": "unt_019fbc9b-e582-7a9b-9478-2132858aac91",
  "unt_019fab2b-c66d-74fd-88f9-885e87c374cd": "unt_019fbc9b-e583-72b3-a44a-f249c3fe94af",
  "unt_019fab2b-c66e-7a13-a28b-2fc29baa815a": "unt_019fbc9b-e584-75e5-a63a-c5f0e804a5b7",
  "unt_019fab2b-c66f-78e3-8b27-a15d090d66bb": "unt_019fbc9b-e585-7549-bddf-33f94272bf7c",
  "unt_019fab2b-c670-76ed-98ce-60cb9fd3cca9": "unt_019fbc9b-e586-7296-8f8e-d8d7f4e3f271",
  "unt_019fab2b-c671-7a0d-8a91-25153c02b679": "unt_019fbc9b-e587-710a-b0e2-b4062f2c1593",
  "asv_019fab2b-c674-7eaa-9161-6e6fb3ea0098": "asv_019fbc9b-e588-7781-a364-129bfca17614",
  "asv_019fab2b-c675-7d2e-a889-ed10d84c77a3": "asv_019fbc9b-e589-719f-80cf-cdb0a8a7ddc9",
  "rsv_019fab2b-c677-737a-b508-94046f3377cc": "rsv_019fbc9b-e58a-7f9c-bd11-087702c2af59",
  "acc_019fab2b-c678-7cd8-8ab6-993e7c68fa5d": "acc_019fbc9b-e58b-7987-a2fd-2a92219a2734",
  "rgt_019fab2b-c679-7667-8631-deb2f7757b23": "rgt_019fbc9b-e58c-7072-a038-453030ec1617",
  "frs_019fab2b-c67a-7b8b-bb20-0641afb16506": "frs_019fbc9b-e58d-7aa7-a3d6-403bfd12e31b",
  "prvdc_019fab2b-c67b-723d-bbb1-d8e12686394e": "prvdc_019fbc9b-e58e-7340-9f14-5f2cefc4560c",
  "opt_019fab2b-c67c-7f73-9f98-6ca52fc12591": "opt_019fbc9b-e58f-708c-a544-9e0e187e1d0d",
  "plc_019fab2b-c67d-76b9-99db-4a1a5df9ed56": "plc_019fbc9b-e590-7114-ae1d-b88ab7f0056e",
  "cpm_019fab2b-c67e-78eb-b696-5dfe578ec31f": "cpm_019fbc9b-e591-71a2-8c60-968c0ab910ec",
  "cpm_019fab2b-c67f-72b3-b217-dc4e1d2d523e": "cpm_019fbc9b-e592-71c3-901d-b13db2747636",
  "cpm_019fab2b-c680-79de-8b4a-466337665d72": "cpm_019fbc9b-e593-7ae2-8b62-a181bcde14d5",
  "cpm_019fab2b-c681-7312-a5d6-5fb7bd918b01": "cpm_019fbc9b-e594-7c4f-bec9-9b9043f52bab",
  "crv_019fab2b-c69c-7992-b89f-b1c817d7f8e0": "crv_019fbc9b-e595-7117-9eea-b4c10b33bc5f",
  "unt_019fab2b-c69d-7cc4-bcd3-0aaeaa71f784": "unt_019fbc9b-e596-796d-9219-f56c4e05cd86",
  "unt_019fab2b-c69e-7376-86b8-38621f247bc4": "unt_019fbc9b-e597-7343-9555-e1ec12d29887",
  "unt_019fab2b-c69f-769c-8b97-9fd2ab002d4f": "unt_019fbc9b-e598-7d71-a8ca-b843ccfc95b3",
  "unt_019fab2b-c6a0-78c9-931c-6a941a92f918": "unt_019fbc9b-e599-74e4-95a6-9d66bb7a497e",
  "unt_019fab2b-c6a1-7fcb-a54d-20fea6256b46": "unt_019fbc9b-e59a-711a-83b6-7b1686127ee2",
  "unt_019fab2b-c6a2-7361-95f7-9deff8bc17d4": "unt_019fbc9b-e59b-7c56-8dbc-8c00113e0e27",
  "unt_019fab2b-c6a3-744a-819f-75543c3f13fd": "unt_019fbc9b-e59c-72be-924e-f8c27eb0bf37",
  "unt_019fab2b-c6a4-79fa-b94e-dcfd5e9755c2": "unt_019fbc9b-e59d-7ee7-93ae-b2d8ce663d99",
  "asv_019fab2b-c6a7-7a12-8a63-4946405b42ad": "asv_019fbc9b-e59e-72bf-bc0a-d0c1c734af6d",
  "asv_019fab2b-c6a8-734b-b00c-947acb71b958": "asv_019fbc9b-e59f-7af6-875e-02777265cce2",
  "rsv_019fab2b-c6aa-7af2-b44d-a594313aecc3": "rsv_019fbc9b-e5a0-74d7-a558-00869676b33b",
  "acc_019fab2b-c6ab-7a5e-932d-3acaaf1bd545": "acc_019fbc9b-e5a1-79e1-8be1-b2b60fa9ee80",
  "rgt_019fab2b-c6ac-718d-a37f-e076a143993a": "rgt_019fbc9b-e5a2-786a-8171-2e0d525049d0",
  "frs_019fab2b-c6ad-7b34-96fa-9cb3c92d567a": "frs_019fbc9b-e5a3-7404-ad71-f8f7108ac63c",
  "prvdc_019fab2b-c6ae-76bf-8c71-1fbf9ed723bb": "prvdc_019fbc9b-e5a4-7af2-a4bf-e223f26f9132",
  "opt_019fab2b-c6af-72e0-a77e-b45287f395b1": "opt_019fbc9b-e5a5-7fcf-bcc9-36aa0a7bb094",
  "plc_019fab2b-c6b0-766a-8fd5-1b93ca50670e": "plc_019fbc9b-e5a6-7a24-bc2c-3643643c04e6",
  "cpm_019fab2b-c6b1-7b1c-b4d8-40ceda60e1fb": "cpm_019fbc9b-e5a7-7654-86f1-efb634a191b0",
  "cpm_019fab2b-c6b2-79a5-9721-8282088e77ec": "cpm_019fbc9b-e5a8-7eb7-a181-75d63aecbe5f",
  "cpm_019fab2b-c6b3-756c-a89f-9d156645a9dc": "cpm_019fbc9b-e5a9-7691-8af1-ee3c388fbae7",
  "cpm_019fab2b-c6b4-7949-9974-a230e21a2519": "cpm_019fbc9b-e5aa-7eac-9acd-cb4ebf786a26",
  "crv_019fab2b-c6b6-7c7e-8bc3-b91542689fa3": "crv_019fbc9b-e5ab-7289-ad69-34777f4a0a6e",
  "unt_019fab2b-c6b7-76fe-8266-8b71de3f910f": "unt_019fbc9b-e5ac-7be9-bd32-81024b48e7bc",
  "unt_019fab2b-c6b8-7940-85f2-a51235ed5a5c": "unt_019fbc9b-e5ad-7002-b378-460eacb0509b",
  "unt_019fab2b-c6b9-7c00-8b17-3f2c55b814ed": "unt_019fbc9b-e5ae-7eaf-be99-8263c6aea671",
  "unt_019fab2b-c6ba-7efa-b1b3-6a13cab1910a": "unt_019fbc9b-e5af-7cbb-8917-69c03cc3ad50",
  "unt_019fab2b-c6bb-7cb1-aa6a-1b74e3b9c454": "unt_019fbc9b-e5b0-76eb-a4d8-7a59878676f1",
  "unt_019fab2b-c6bc-7a46-b996-991a4e7492b7": "unt_019fbc9b-e5b1-78f3-a7f3-9a1178cfb5b2",
  "unt_019fab2b-c6bd-76ae-a674-c21c9d6752f3": "unt_019fbc9b-e5b2-7eca-b63f-d22f9344e4c7",
  "unt_019fab2b-c6be-754a-86a5-974311d9a51e": "unt_019fbc9b-e5b3-7360-a125-8a3ac86c73e1",
  "asv_019fab2b-c6c1-794d-8316-fae5f26b44a4": "asv_019fbc9b-e5b4-71e3-927d-37c11659587b",
  "asv_019fab2b-c6c2-72c8-93ed-124b252c0357": "asv_019fbc9b-e5b5-7ffc-bc64-3e3e06e6b34a",
  "rsv_019fab2b-c6c4-7eb4-bf41-83263e62b607": "rsv_019fbc9b-e5b6-7f59-a850-db9e64c63242",
  "acc_019fab2b-c6c5-78dd-897e-78a3cc64d961": "acc_019fbc9b-e5b7-7da0-ab76-b87db454bdca",
  "rgt_019fab2b-c6c6-70ad-b30e-d4a9e3d20c63": "rgt_019fbc9b-e5b8-7156-9adf-60cb5c9e57d9",
  "frs_019fab2b-c6c7-7f7e-9235-79f72b2e5ffc": "frs_019fbc9b-e5b9-7e92-9df6-bce60487d73a",
  "prvdc_019fab2b-c6c8-7181-ba11-f0186a9e2e31": "prvdc_019fbc9b-e5ba-7da9-9b59-755d0945a7f9",
  "opt_019fab2b-c6c9-720e-b76a-343a6d048ebd": "opt_019fbc9b-e5bb-76ac-b6b5-213f33f42ba2",
  "plc_019fab2b-c6ca-7421-bc33-937f199fd5e8": "plc_019fbc9b-e5bc-77d8-95c9-1964a3ed9fbc",
  "cpm_019fab2b-c6cb-7a80-b116-8d561318bb00": "cpm_019fbc9b-e5bd-7fdb-afc7-30b5a43d9595",
  "cpm_019fab2b-c6cc-73bf-b3c7-4968d4dace13": "cpm_019fbc9b-e5be-7447-bc74-d6d3b8d3dd04",
  "cpm_019fab2b-c6cd-791f-bc55-98a90f17fe6b": "cpm_019fbc9b-e5bf-72d8-8b4d-58d0b40c547d",
  "cpm_019fab2b-c6ce-76af-b7e3-9d0bfe528f04": "cpm_019fbc9b-e5c0-77b9-a379-08ab9723f50b",
  "crv_019fab2b-c6d0-7547-97d6-8393bd431936": "crv_019fbc9b-e5c1-703a-bf03-e9f1070e2936",
  "unt_019fab2b-c6d1-7f22-bddb-ea1f7e4e7f47": "unt_019fbc9b-e5c2-7922-b954-5c9148a2cbc2",
  "unt_019fab2b-c6d2-7fcb-9ae3-d3d88335e997": "unt_019fbc9b-e5c3-7e59-b85b-3744187ff21f",
  "unt_019fab2b-c6d3-7c43-8505-ef13d3f202e6": "unt_019fbc9b-e5c4-7df7-9ada-bddecf16e68e",
  "unt_019fab2b-c6d4-7a3f-bc52-34af6d7a263f": "unt_019fbc9b-e5c5-7b92-8620-04a24fedef5c",
  "unt_019fab2b-c6d5-7d2a-a627-7135ab51eda2": "unt_019fbc9b-e5c6-7c14-b680-0015f14426a1",
  "unt_019fab2b-c6d6-767e-946a-00579b64f0fb": "unt_019fbc9b-e5c7-7c36-b24f-1aa3fa600565",
  "unt_019fab2b-c6d7-7b09-8c4b-c83f6309d58c": "unt_019fbc9b-e5c8-7365-b7b5-76b1886c69bb",
  "unt_019fab2b-c6d8-7f90-9f3c-6cd8d56b4d0b": "unt_019fbc9b-e5c9-7d80-a1f7-75a722b2d285",
  "asv_019fab2b-c6db-704f-8677-94f981a9f94e": "asv_019fbc9b-e5ca-7807-8d87-bf48d13cb6f8",
  "asv_019fab2b-c6dc-767e-a9d3-cb100afa9a74": "asv_019fbc9b-e5cb-78f2-b5c2-bb03941f3b19",
  "rsv_019fab2b-c6de-79e7-afd2-09db04f46860": "rsv_019fbc9b-e5cc-74fb-9c6c-f9c869c9c98a",
  "acc_019fab2b-c6df-71d3-8562-5069be37136e": "acc_019fbc9b-e5cd-7e00-80d7-8c10d420e73d",
  "rgt_019fab2b-c6e0-7902-84bb-be13dc2c27fd": "rgt_019fbc9b-e5ce-78ef-a3d0-e5a51f6484ad",
  "frs_019fab2b-c6e1-721f-bebf-4b5c07753043": "frs_019fbc9b-e5cf-767b-bd2c-3bf3a2ca6374",
  "prvdc_019fab2b-c6e2-7131-b424-713cebac95fc": "prvdc_019fbc9b-e5d0-74c2-a59f-dc7c1248d235",
  "opt_019fab2b-c6e3-7902-94c0-98221f6b83e4": "opt_019fbc9b-e5d1-7fa2-814e-6db93a2d5097",
  "plc_019fab2b-c6e4-7b7a-bade-6da8ce45ec18": "plc_019fbc9b-e5d2-716f-aecd-091f060a4a81",
  "cpm_019fab2b-c6e5-71ce-b8cd-80c362423675": "cpm_019fbc9b-e5d3-79b5-9fb3-9eabb5a7fcd3",
  "cpm_019fab2b-c6e6-7f75-b3ed-0d82bcc65567": "cpm_019fbc9b-e5d4-7603-8f36-bc0999416008",
  "cpm_019fab2b-c6e7-72db-9dc3-05280093e1c1": "cpm_019fbc9b-e5d5-7332-9d9f-16c3a40936bf",
  "cpm_019fab2b-c6e8-7979-a248-6858dae76790": "cpm_019fbc9b-e5d6-7950-bb87-b0a2da940695",
  "crv_019fab2b-c6ea-7d5e-b3c6-7c1d06b686eb": "crv_019fbc9b-e5d7-7955-84f5-cf390cc69b6f",
  "unt_019fab2b-c6eb-7547-b1e5-a28f00d1d42b": "unt_019fbc9b-e5d8-7a2f-a4bc-248ab7dcafa6",
  "unt_019fab2b-c6ec-7e1b-8c69-a89ad449661c": "unt_019fbc9b-e5d9-7005-89a9-4e88f85a0370",
  "unt_019fab2b-c6ed-7ef3-b28b-18b248f711a9": "unt_019fbc9b-e5da-7640-a3c5-d859ea27a81a",
  "unt_019fab2b-c6ee-7510-88e5-aadfe974cee9": "unt_019fbc9b-e5db-761e-b16c-aad1232735db",
  "unt_019fab2b-c6ef-71a9-a874-e89f2758bfad": "unt_019fbc9b-e5dc-7d8d-a235-55c671f86479",
  "unt_019fab2b-c6f0-7089-b6cf-5d2f85473c02": "unt_019fbc9b-e5dd-7ae7-9084-05e18e02f83b",
  "unt_019fab2b-c6f1-7405-aa11-ec8315138b7e": "unt_019fbc9b-e5de-7076-bd4c-720b1a277ab8",
  "unt_019fab2b-c6f2-78c6-92cf-717ae922d9ed": "unt_019fbc9b-e5df-7948-bbaf-f5b77ddcd956",
  "asv_019fab2b-c6f5-7452-a4b8-4ba69085c3a3": "asv_019fbc9b-e5e0-7714-8436-dfaa603d8276",
  "asv_019fab2b-c6f6-7f5e-9abd-3e80f9767ce5": "asv_019fbc9b-e5e1-785c-8644-ec853b17e5e2",
  "rsv_019fab2b-c6f8-72b8-a916-f07ec04a7eb3": "rsv_019fbc9b-e5e2-7f17-9eef-23b34bbe8ebb",
  "acc_019fab2b-c6f9-78d8-98b8-bcfa59e4d3ef": "acc_019fbc9b-e5e3-772e-8af0-8ca8ab9a6406",
  "rgt_019fab2b-c6fa-7c99-bb4a-71db1ca13215": "rgt_019fbc9b-e5e4-7032-ad03-26dc5e0e09ee",
  "frs_019fab2b-c6fb-78e1-8f6d-6063b1c5a85e": "frs_019fbc9b-e5e5-7c2f-a3b6-c07845163882",
  "prvdc_019fab2b-c6fc-77e5-a542-abe68020c414": "prvdc_019fbc9b-e5e6-7f84-83b8-360b536c994c",
  "opt_019fab2b-c6fd-730c-a5f2-8e380fabfd86": "opt_019fbc9b-e5e7-762c-a56a-7845056c2700",
  "plc_019fab2b-c6fe-78a9-9295-1795e7edf054": "plc_019fbc9b-e5e8-7587-b116-6625497ae566",
  "cpm_019fab2b-c6ff-7f91-bb47-43415f1d451f": "cpm_019fbc9b-e5e9-714b-ab7a-485485554ed2",
  "cpm_019fab2b-c700-7c06-86f1-53272c1e45ae": "cpm_019fbc9b-e5ea-731f-aeac-23f0a971f246",
  "cpm_019fab2b-c701-7d8c-aa74-5d65fd1aaa4f": "cpm_019fbc9b-e5eb-7964-bbe1-3356501c4b7a",
  "cpm_019fab2b-c702-7c32-ac92-47262c24ec2e": "cpm_019fbc9b-e5ec-7609-a489-e8effe86f588",
  "cpm_019fab2b-c703-7811-8e84-98befd14fcfe": "cpm_019fbc9b-e5ed-7f41-b147-edbe06522d28",
  "crv_019fab2b-c705-724e-852a-452737314e1c": "crv_019fbc9b-e5ee-7cd6-83c4-4350e2453482",
  "unt_019fab2b-c706-71d9-97ec-6448e46302e7": "unt_019fbc9b-e5ef-7935-a7d8-f86f77e1e882",
  "unt_019fab2b-c707-757c-a2b3-9fecbde0c79c": "unt_019fbc9b-e5f0-7960-be4a-ad21a0be4c66",
  "unt_019fab2b-c708-7ed3-bb6c-d62f4bf8f5d0": "unt_019fbc9b-e5f1-765c-b761-d122f0223767",
  "unt_019fab2b-c709-7fcd-a106-45fe45c79e2d": "unt_019fbc9b-e5f2-7a3e-840d-c8e690bdb279",
  "unt_019fab2b-c70a-7761-a57e-33a33c4a7762": "unt_019fbc9b-e5f3-781a-a40d-b91dfa78a278",
  "unt_019fab2b-c70b-7f83-bc3a-f2f2887bf625": "unt_019fbc9b-e5f4-7765-9e48-8323e0cc18f3",
  "unt_019fab2b-c70c-7e54-8db1-fb498457ec30": "unt_019fbc9b-e5f5-703f-acbe-76241ad39cbd",
  "unt_019fab2b-c70d-72e5-9e58-c199c04c8899": "unt_019fbc9b-e5f6-71c4-9f49-1008c379e099",
  "asv_019fab2b-c710-76da-a99b-b546e02cc7f4": "asv_019fbc9b-e5f7-7f59-be2c-d4ad5519ba9e",
  "asv_019fab2b-c711-71e1-bb24-f35918765ace": "asv_019fbc9b-e5f8-7b8b-9f17-32c8be8971d5",
  "rsv_019fab2b-c713-72eb-a148-98c0db5e6345": "rsv_019fbc9b-e5f9-76fc-993b-ce94d9cad2f6",
  "acc_019fab2b-c714-792c-8fb5-94505f1c8670": "acc_019fbc9b-e5fa-77db-bb8e-6f03a91c37e3",
  "rgt_019fab2b-c715-7574-9db7-e07a36822f11": "rgt_019fbc9b-e5fb-70d1-9700-6624a135d5c6",
  "frs_019fab2b-c716-70fd-834a-91ebb1207a45": "frs_019fbc9b-e5fc-7b2b-82c3-193300a7355e",
  "prvdc_019fab2b-c717-7a4f-8e1e-35a05d3f85b3": "prvdc_019fbc9b-e5fd-768a-8811-f5c4544100de",
  "opt_019fab2b-c718-7b38-ad33-95ebfa07dbdb": "opt_019fbc9b-e5fe-78e6-a7ca-bfbf0f6c94c8",
  "plc_019fab2b-c719-70b2-8bfd-f688fc8d5841": "plc_019fbc9b-e5ff-79b9-bb89-f2aedfa45fee",
  "cpm_019fab2b-c71a-794d-93e6-119ad9719045": "cpm_019fbc9b-e600-707e-b06e-ebf8af6fe435",
  "cpm_019fab2b-c71b-7f0f-9c95-2e667d1d9b42": "cpm_019fbc9b-e601-72d7-9f65-bae5890f6a7a",
  "cpm_019fab2b-c71c-7581-bad4-bc316ffd3742": "cpm_019fbc9b-e602-78b8-8bae-75aa470ba295",
  "cpm_019fab2b-c71d-7f98-b7bb-bf627e54ed26": "cpm_019fbc9b-e603-7b3b-9e4c-fe1596d300f5",
  "crv_019fab2b-c71f-7256-b3aa-2a52a045528b": "crv_019fbc9b-e604-7618-8138-b4af924053b0",
  "unt_019fab2b-c720-73be-b724-d0750eb1b864": "unt_019fbc9b-e605-7ae1-96f5-ffa24c074767",
  "unt_019fab2b-c721-7c4b-b496-3b42d685ec88": "unt_019fbc9b-e606-7be8-8bd3-2270b29b6802",
  "unt_019fab2b-c722-7f7b-a870-43ba0d180bf6": "unt_019fbc9b-e607-7606-b641-e7333c3d1096",
  "unt_019fab2b-c723-7032-80e0-3ebab5b42a79": "unt_019fbc9b-e608-7080-8ad9-0df00a85a03b",
  "unt_019fab2b-c724-70ab-aec9-ecbebe0f4c52": "unt_019fbc9b-e609-7902-901f-94f61671cc4a",
  "unt_019fab2b-c725-7095-8fbd-ceef73fc3bd4": "unt_019fbc9b-e60a-785c-8924-6ea0c1c1f588",
  "unt_019fab2b-c726-7ee6-9701-447f5c469257": "unt_019fbc9b-e60b-7dd3-8cb4-4f61ca9aac27",
  "unt_019fab2b-c727-7591-b116-757e71a7fbea": "unt_019fbc9b-e60c-7b0b-a460-1aa7d5edf04c",
  "asv_019fab2b-c72a-7bf9-ab3c-738f0fc7b0d0": "asv_019fbc9b-e60d-740f-86ac-a4bef60face2",
  "asv_019fab2b-c72b-731b-9a03-449e2e3d3c35": "asv_019fbc9b-e60e-75be-a126-dc77e26474c3",
  "rsv_019fab2b-c72d-7be1-992a-c36f1bd67a24": "rsv_019fbc9b-e60f-7de1-8914-588d47d2ddd5",
  "acc_019fab2b-c72e-7c04-97d7-2f343d834755": "acc_019fbc9b-e610-740d-ae27-59a76ff83f64",
  "rgt_019fab2b-c72f-758d-ac6b-1c8f29dcee8d": "rgt_019fbc9b-e611-706f-8354-4a5616146ad3",
  "frs_019fab2b-c730-7c99-b457-59e108cead7d": "frs_019fbc9b-e612-77a9-b048-f52ed4072d4b",
  "prvdc_019fab2b-c731-78dd-8444-ab91e170d23b": "prvdc_019fbc9b-e613-7162-8f80-c2bceed72a23",
  "opt_019fab2b-c732-75e2-9cae-75ad00a38272": "opt_019fbc9b-e614-7e81-8bb1-79c075a062fc",
  "plc_019fab2b-c733-70b8-89cd-54daf979d81a": "plc_019fbc9b-e615-7b9a-afbf-4470c1e93c6e",
  "cpm_019fab2b-c734-720f-82a2-acebae82f04e": "cpm_019fbc9b-e616-7ab1-b9a6-84378ef27305",
  "cpm_019fab2b-c735-7505-ba90-83f90188d06e": "cpm_019fbc9b-e617-7032-b02e-86936a1b0111",
  "cpm_019fab2b-c736-7167-a001-17d07a41024f": "cpm_019fbc9b-e618-7055-8b9f-aed44593fd84",
  "crv_019fab2b-c738-7af8-8f8d-faa9b9e2ca3b": "crv_019fbc9b-e619-7135-811f-054783fbae94",
  "unt_019fab2b-c739-7a31-9332-ffb14527107e": "unt_019fbc9b-e61a-73e5-8ffa-548344ef951d",
  "unt_019fab2b-c73a-7dab-9f31-f0219d526397": "unt_019fbc9b-e61b-77a5-a877-46c2533a8be1",
  "unt_019fab2b-c73b-71da-a401-65afda663fff": "unt_019fbc9b-e61c-77d1-aaa8-fc930ab8c4da",
  "unt_019fab2b-c73c-79af-93db-db8fe5d612b1": "unt_019fbc9b-e61d-72d1-a857-1ed450de548b",
  "unt_019fab2b-c73d-7b74-90ed-d23fb350a791": "unt_019fbc9b-e61e-7f11-b554-5a48690cfc9a",
  "unt_019fab2b-c73e-79d5-a8da-3e4e712fb436": "unt_019fbc9b-e61f-7767-825b-5edf8433d717",
  "unt_019fab2b-c73f-717c-bd87-82ed433e96d4": "unt_019fbc9b-e620-7496-be36-230bceaa551a",
  "unt_019fab2b-c740-7d13-8c9a-a6eba5425d33": "unt_019fbc9b-e621-7718-a6e5-a47cfc8fc3c9",
  "asv_019fab2b-c743-735c-83e2-7415fa5a393f": "asv_019fbc9b-e622-7743-866a-eb01963d7dda",
  "asv_019fab2b-c744-7329-b637-e6ceb9d0cc53": "asv_019fbc9b-e623-7ee6-add0-1b3ac867fcd5",
  "rsv_019fab2b-c746-742b-85b1-76e968064440": "rsv_019fbc9b-e624-7559-b6cb-f2d1d60b6dc1",
  "acc_019fab2b-c747-7342-bc76-98288488ac83": "acc_019fbc9b-e625-7924-8c15-20edbac58465",
  "rgt_019fab2b-c748-763c-8ee4-6d16e1c1b89f": "rgt_019fbc9b-e626-7944-bf26-a87e49c3c7cd",
  "frs_019fab2b-c749-7eff-8ffa-7a68ed51f2c6": "frs_019fbc9b-e627-7066-96f2-f2b8c26580a7",
  "prvdc_019fab2b-c74a-74ee-975c-8641759bdb30": "prvdc_019fbc9b-e628-7d39-8ca7-5ac8a4e5e59f",
  "opt_019fab2b-c74b-7723-a69e-d8adf895ba08": "opt_019fbc9b-e629-7d3a-bd71-ef5ebb1bd253",
  "plc_019fab2b-c74c-7087-b950-2aa23b8b6866": "plc_019fbc9b-e62a-78d7-857e-cbdf01517c58",
  "cpm_019fab2b-c74d-772e-b6a6-63ca3353d549": "cpm_019fbc9b-e62b-7cbc-b956-56c3421240e3",
  "cpm_019fab2b-c74e-7a4e-9a48-37a8ed991973": "cpm_019fbc9b-e62c-7e24-804e-39643b127769",
  "cpm_019fab2b-c74f-7652-b4d6-75e440a313b2": "cpm_019fbc9b-e62d-7465-b95c-5abe3de4d6dc",
  "crv_019fab2b-c783-7d87-9be3-8d46b98ef6d7": "crv_019fbc9b-e62e-73eb-a022-1aaf284c5dd9",
  "unt_019fab2b-c784-756d-b5df-20db22fbbfb9": "unt_019fbc9b-e62f-789c-a6fa-259ecf2f76ae",
  "unt_019fab2b-c785-7ac2-a499-3ca1878c2af4": "unt_019fbc9b-e630-7057-9ef7-892bb87c4ee6",
  "unt_019fab2b-c786-7f5b-96f6-b0293e9650dc": "unt_019fbc9b-e631-7211-8667-ac51018ff59f",
  "unt_019fab2b-c787-78f5-8c54-f35aa3d10bb6": "unt_019fbc9b-e632-7dd1-9942-5c76236e1072",
  "unt_019fab2b-c788-7dce-b129-94d982b85f0a": "unt_019fbc9b-e633-7b5e-8595-e5256ba634dc",
  "unt_019fab2b-c789-7c8a-a77e-45961b07d193": "unt_019fbc9b-e634-741e-b3b2-af83276cb5ab",
  "unt_019fab2b-c78a-7bd1-afd1-1db7af597ca8": "unt_019fbc9b-e635-7477-a6d6-acea46c6d6bd",
  "unt_019fab2b-c78b-73bb-8192-45750c9aa65f": "unt_019fbc9b-e636-75f7-a6f6-67d80a8ba709",
  "asv_019fab2b-c78e-70d3-ae68-54645128fddb": "asv_019fbc9b-e637-7a12-954b-24af446e22bd",
  "asv_019fab2b-c78f-79c9-bbbd-b39c437852a0": "asv_019fbc9b-e638-7aa9-bff5-32de6ea9ca3d",
  "rsv_019fab2b-c791-78b0-ab27-856652461dac": "rsv_019fbc9b-e639-7061-aff7-bdd03bd8e3e2",
  "acc_019fab2b-c792-7e6d-9d2b-5b9ee84d0535": "acc_019fbc9b-e63a-7ea0-9fe2-fa826b6f2c38",
  "rgt_019fab2b-c793-79cd-85ce-96caf3cc38eb": "rgt_019fbc9b-e63b-7e98-a3c7-c9e9b7155acc",
  "frs_019fab2b-c794-767a-96c0-55128fed20ae": "frs_019fbc9b-e63c-7a94-8b27-04d48757cc86",
  "prvdc_019fab2b-c795-7fa4-af57-7ed33d52c1b7": "prvdc_019fbc9b-e63d-71a9-889a-ed507e502a94",
  "plc_019fab2b-c797-7273-8a6b-53e0433fbef3": "plc_019fbc9b-e63e-7402-96ce-4af9e83787f8",
  "cpm_019fab2b-c798-7918-86eb-ba90bd5d49b4": "cpm_019fbc9b-e63f-72b6-a110-5dba24e09da5",
  "cpm_019fab2b-c799-7943-95b2-158b98de923d": "cpm_019fbc9b-e640-7f36-93d0-8530ce46b1e3",
  "cpm_019fab2b-c79a-7597-9eed-92dfb487fa35": "cpm_019fbc9b-e641-7fa4-92d1-b30bf8ffdca7",
  "opt_019fab2b-c77d-784b-80dc-5361f2f99bc0": "opt_019fbca1-b4b5-73f7-b38e-dd8d70c6d1ef",
} as const satisfies Readonly<Record<string, string>>;

export const computerScienceV11IdentityReplacements = {
  ...computerScienceV11DirectIdentityReplacements,
  ...computerScienceV11PrerequisiteClosureIdentityReplacements,
} as const satisfies Readonly<Record<string, string>>;

type IdentityReplacementKey = keyof typeof computerScienceV11IdentityReplacements;

function replacementFor<OldId extends IdentityReplacementKey>(oldId: OldId) {
  return computerScienceV11IdentityReplacements[oldId];
}

function recursivelyRemapIdentities<Value>(value: Value): Value {
  if (typeof value === "string") {
    return (computerScienceV11IdentityReplacements[
      value as IdentityReplacementKey
    ] ?? value) as Value;
  }
  if (Array.isArray(value)) {
    return value.map(recursivelyRemapIdentities) as Value;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        recursivelyRemapIdentities(child),
      ]),
    ) as Value;
  }
  return value;
}

const remapped = recursivelyRemapIdentities(computerScienceIdentities);

/**
 * The complete 1.1 identity manifest. It is a deep copy of 1.0 with the
 * explicit replacement ledger applied; revised topic keys are then attached
 * to their newly allocated unit identities.
 */
export const computerScienceV11Identities = {
  ...remapped,
  courses: {
    ...remapped.courses,
    "computer-architecture": {
      ...remapped.courses["computer-architecture"],
      learningUnitIds: {
        "gates-combinational-circuits-and-sequential-logic": replacementFor("unt_019fab2b-c4d9-7d9e-aa4e-cbbbb37e9844"),
        "instruction-set-architecture-and-assembly-programming": replacementFor("unt_019fab2b-c4da-7c84-92ae-b69a449095ff"),
        "processor-datapath-control-and-instruction-execution": replacementFor("unt_019fab2b-c4db-7438-80f6-f3fd0881f536"),
        "pipelining-data-control-hazards-and-forwarding": replacementFor("unt_019fab2b-c4dc-7253-86cb-896a61794552"),
        "caches-locality-and-the-memory-hierarchy": replacementFor("unt_019fab2b-c4dd-7200-8eb5-8e9ee458d48b"),
        "virtual-memory-exceptions-and-input-output": replacementFor("unt_019fab2b-c4de-73c8-a8c4-af20565dbff6"),
        "parallelism-performance-models-and-measurement": replacementFor("unt_019fab2b-c4df-799c-8342-877401d1a32e"),
        "processor-memory-system-integration-and-defense": replacementFor("unt_019fab2b-c4e0-7192-8009-22bb88e27f29"),
      },
    },
    algorithms: {
      ...remapped.courses.algorithms,
      learningUnitIds: {
        "algorithmic-modeling-correctness-and-asymptotic-analysis": replacementFor("unt_019fab2b-c53c-72a3-a5a1-9a74ab282aa2"),
        "recurrences-divide-and-conquer-and-sorting": replacementFor("unt_019fab2b-c53d-7b89-b7b6-3d5d66db3213"),
        "greedy-algorithms-minimum-spanning-trees-and-shortest-paths": replacementFor("unt_019fab2b-c53e-74f9-be6b-aaedfc781b57"),
        "dynamic-programming-design-and-correctness": replacementFor("unt_019fab2b-c53f-7051-b301-6556dbf2c090"),
        "maximum-flow-minimum-cuts-and-matching": replacementFor("unt_019fab2b-c540-7318-bccb-0fd71b93dfb2"),
        "reductions-p-np-and-np-completeness": replacementFor("unt_019fab2b-c541-777f-b185-ae7863cec5d9"),
        "approximation-algorithms-and-intractability-tradeoffs": replacementFor("unt_019fab2b-c542-724e-ac3a-4dfb45da2156"),
        "cumulative-algorithm-design-proof-and-defense": replacementFor("unt_019fab2b-c543-7f83-a16f-c1a3064071e9"),
      },
    },
    "programming-languages": {
      ...remapped.courses["programming-languages"],
      learningUnitIds: {
        "immutability-expressions-and-equational-reasoning": replacementFor("unt_019fab2b-c5d2-7549-a605-67a6dcf67b1d"),
        "algebraic-data-types-and-pattern-matching": replacementFor("unt_019fab2b-c5d3-71d9-93ef-ad7421c36130"),
        "structural-recursion-folds-and-inductive-data": replacementFor("unt_019fab2b-c5d4-7d15-9e0c-338eaf44478c"),
        "higher-order-functions-composition-and-abstraction": replacementFor("unt_019fab2b-c5d5-7ef8-9ea8-a215670afa31"),
        "lexical-scope-environments-and-closures": replacementFor("unt_019fab2b-c5d6-7d59-99f4-7796e038339a"),
        "persistent-data-structures-modules-and-interfaces": replacementFor("unt_019fab2b-c5d7-7524-ae61-a0eb988d9903"),
        "polymorphic-types-type-checking-and-inference": replacementFor("unt_019fab2b-c5d8-7560-b2c1-c7bfa239b4e1"),
        "functional-imperative-and-object-oriented-comparison-with-interpreter-defense": replacementFor("unt_019fab2b-c5d9-7cab-b3ee-22b04597e8b0"),
      },
    },
    "machine-learning": {
      ...remapped.courses["machine-learning"],
      learningUnitIds: {
        "linear-regression-empirical-risk-and-gradient-optimization": replacementFor("unt_019fab2b-c650-739d-a159-a3799321f3c6"),
        "classification-logistic-models-and-decision-boundaries": replacementFor("unt_019fab2b-c651-7fec-82f6-1c07f59ef273"),
        "margin-based-classification-kernels-and-features": replacementFor("unt_019fab2b-c652-72bd-a427-00cc6cd83bca"),
        "generalization-regularization-and-model-selection": replacementFor("unt_019fab2b-c653-7356-8072-66ec9ffaa8b6"),
        "neural-networks-backpropagation-and-optimization": replacementFor("unt_019fab2b-c654-7695-86a5-eb75a5914f3b"),
        "probabilistic-models-latent-variables-and-inference": replacementFor("unt_019fab2b-c655-7269-9516-2409a263a67f"),
        "reinforcement-learning-and-sequential-decisions": replacementFor("unt_019fab2b-c656-7c1d-ac9c-af62e267b6da"),
        "model-comparison-error-analysis-fairness-and-defense": replacementFor("unt_019fab2b-c657-78bd-802a-f78fbfca58d6"),
      },
    },
    "parallel-computing": {
      ...remapped.courses["parallel-computing"],
      learningUnitIds: {
        "computation-dags-work-span-and-parallelism": replacementFor("unt_019fab2b-c752-70bd-8aa7-7fb65821d26b"),
        "work-efficiency-scheduling-and-brent-s-theorem": replacementFor("unt_019fab2b-c753-7cb6-b60c-86e7bd451282"),
        "parallel-divide-and-conquer-and-sequence-algorithms": replacementFor("unt_019fab2b-c754-74ca-9ae1-73eeed7a4752"),
        "scan-prefix-computation-and-parallel-data-structures": replacementFor("unt_019fab2b-c755-7360-a1e1-d813b91e87f8"),
        "shared-memory-synchronization-and-contention": replacementFor("unt_019fab2b-c756-7165-9268-7ff876b123ee"),
        "distributed-memory-message-passing-and-decomposition": replacementFor("unt_019fab2b-c757-7188-8924-564c4b797e66"),
        "locality-caches-profiling-and-scaling-analysis": replacementFor("unt_019fab2b-c758-7eb7-ba41-74b138e64f47"),
        "work-efficient-parallel-implementation-and-defense": replacementFor("unt_019fab2b-c759-7d96-99aa-eb6b66b3e596"),
      },
    },
  },
} as const;

function collectIdentityValues(value: unknown, values: string[] = []): string[] {
  if (typeof value === "string") {
    values.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((child) => collectIdentityValues(child, values));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((child) => collectIdentityValues(child, values));
  }
  return values;
}

const uuidV7Identity =
  /^[a-z]+_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const originalIdentityValues = new Set(
  collectIdentityValues(computerScienceIdentities),
);
const replacementEntries = Object.entries(
  computerScienceV11IdentityReplacements,
);
const replacementValues = replacementEntries.map(([, value]) => value);

if (new Set(replacementValues).size !== replacementValues.length) {
  throw new Error("Computer Science 1.1 identity replacements must be unique.");
}

for (const [oldId, newId] of replacementEntries) {
  if (!originalIdentityValues.has(oldId)) {
    throw new Error(`Computer Science 1.1 replaces unknown identity ${oldId}.`);
  }
  if (!uuidV7Identity.test(newId)) {
    throw new Error(`Computer Science 1.1 replacement ${newId} is not UUIDv7.`);
  }
  const oldPrefix = oldId.slice(0, oldId.indexOf("_"));
  const newPrefix = newId.slice(0, newId.indexOf("_"));
  if (oldPrefix !== newPrefix) {
    throw new Error(
      `Computer Science 1.1 replacement ${oldId} → ${newId} changes its type prefix.`,
    );
  }
  if (originalIdentityValues.has(newId)) {
    throw new Error(
      `Computer Science 1.1 replacement ${newId} already belongs to 1.0.`,
    );
  }
}

const latestIdentityValues = collectIdentityValues(
  computerScienceV11Identities,
);
const staleIdentity = latestIdentityValues.find((identity) =>
  Object.hasOwn(computerScienceV11IdentityReplacements, identity),
);
if (staleIdentity) {
  throw new Error(
    `Computer Science 1.1 manifest still contains replaced identity ${staleIdentity}.`,
  );
}

for (const replacement of replacementValues) {
  const occurrences = latestIdentityValues.filter(
    (identity) => identity === replacement,
  ).length;
  if (occurrences !== 1) {
    throw new Error(
      `Computer Science 1.1 replacement ${replacement} occurs ${occurrences} times; expected once.`,
    );
  }
}

const republishedCourseKeys = [
  "computer-architecture",
  "algorithms",
  "operating-systems",
  "theory-of-computation",
  "programming-languages",
  "compilers",
  "computer-security",
  "artificial-intelligence",
  "machine-learning",
  "distributed-systems",
  "capstone-1",
  "data-science",
  "research-methods",
  "capstone-2",
  "computer-graphics",
  "computer-vision",
  "natural-language-processing",
  "parallel-computing",
  "applied-cryptography",
] as const;

const prerequisiteClosure = new Set<string>([
  "computer-architecture",
  "algorithms",
  "programming-languages",
  "machine-learning",
  "parallel-computing",
]);
let closureChanged = true;
while (closureChanged) {
  closureChanged = false;
  for (const specification of computerScienceCourseSpecsV1_1) {
    if (
      !prerequisiteClosure.has(specification.key) &&
      specification.prerequisiteKeys.some((key) =>
        prerequisiteClosure.has(key),
      )
    ) {
      prerequisiteClosure.add(specification.key);
      closureChanged = true;
    }
  }
}
const declaredRepublishedCourses = new Set<string>(republishedCourseKeys);
if (
  prerequisiteClosure.size !== declaredRepublishedCourses.size ||
  [...prerequisiteClosure].some(
    (courseKey) => !declaredRepublishedCourses.has(courseKey),
  )
) {
  throw new Error(
    "Computer Science 1.1 identity replacements do not match the prerequisite closure.",
  );
}

for (const courseKey of republishedCourseKeys) {
  const specification = computerScienceCourseSpecsV1_1.find(
    (candidate) => candidate.key === courseKey,
  );
  if (!specification) {
    throw new Error(`Missing Computer Science 1.1 course spec ${courseKey}.`);
  }
  const expectedTopicKeys = specification.topics.map((topic) => topic.key);
  const identityTopicKeys = Object.keys(
    computerScienceV11Identities.courses[courseKey].learningUnitIds,
  );
  if (
    expectedTopicKeys.length !== identityTopicKeys.length ||
    expectedTopicKeys.some((key, index) => key !== identityTopicKeys[index])
  ) {
    throw new Error(
      `Computer Science 1.1 topic identities do not match ${courseKey}.`,
    );
  }
  if (
    computerScienceV11Identities.courses[courseKey].courseVersionId ===
    computerScienceIdentities.courses[courseKey].courseVersionId
  ) {
    throw new Error(
      `Computer Science 1.1 did not republish dependent course ${courseKey}.`,
    );
  }
}

for (const concentrationKey of Object.keys(
  computerScienceIdentities.concentrationIds,
) as (keyof typeof computerScienceIdentities.concentrationIds)[]) {
  if (
    computerScienceV11Identities.concentrationIds[concentrationKey] ===
    computerScienceIdentities.concentrationIds[concentrationKey]
  ) {
    throw new Error(
      `Computer Science 1.1 did not republish concentration ${concentrationKey}.`,
    );
  }
}

for (const specification of computerScienceCourseSpecsV1_1.filter(
  (candidate) => candidate.concentrationKey,
)) {
  const courseKey = specification.key as keyof typeof computerScienceIdentities.courses;
  if (
    computerScienceV11Identities.courses[courseKey].requirementOptionId ===
    computerScienceIdentities.courses[courseKey].requirementOptionId
  ) {
    throw new Error(
      `Computer Science 1.1 did not republish concentration option ${specification.key}.`,
    );
  }
}
