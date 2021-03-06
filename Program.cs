﻿using System;
using System.Collections.Generic;

namespace LeetCode
{
    class Program
    {
        static void Main()
        {
            //Console.WriteLine("enter nums and target");
            //var ts = TwoSum.TwoSumInts(new[] {230, 863, 916, 585, 981, 404, 316, 785, 88, 12, 70, 435, 384, 778, 887, 755, 740, 337, 86, 92, 325, 422, 815, 650, 920, 125, 277, 336, 221, 847, 168, 23, 677, 61, 400, 136, 874, 363, 394, 199, 863, 997, 794, 587, 124, 321, 212, 957, 764, 173, 314, 422, 927, 783, 930, 282, 306, 506, 44, 926, 691, 568, 68, 730, 933, 737, 531, 180, 414, 751, 28, 546, 60, 371, 493, 370, 527, 387, 43, 541, 13, 457, 328, 227, 652, 365, 430, 803, 59, 858, 538, 427, 583, 368, 375, 173, 809, 896, 370, 789}, 542);

            //var l1 = new ListNode(new[] {1, 3, 4, 7, 2}); // new List<int>{2,4,5};
            //var l2 = new ListNode(new[] {2, 1, 3,}); // new List<int> { 4, 6, 5 ,7};

            //var x = Solution.AddTwoNumbers(l1, l2);

            //Console.WriteLine(x.ToString());
            Test();

        }

        public static void Test()
        {
            var tmp = new ReferenceTest { IntType = 100, StringType = "new", BoolType = false};
            var tmp1 = new ReferenceTest { IntType = 101, StringType = "new1", BoolType = false };
            ChangeClassContent(tmp); // 改变
            ChangedClass(tmp1); // 不变
        }

        /// <summary>
        /// 重新赋值
        /// </summary>
        /// <param name="rft"></param>
        public static void ChangedClass(ReferenceTest rft)
        {
            rft = new ReferenceTest();
            rft.IntType = 405;
        }

        /// <summary>
        /// 改变内容
        /// </summary>
        /// <param name="rft"></param>
        public static void ChangeClassContent(ReferenceTest rft)
        {
            rft.StringType = "changed";
            rft.IntType = 404;
            rft.BoolType = true;
        }

        public class ReferenceTest
        {
            public int IntType { get; set; }
            public string StringType { get; set; }
            public bool BoolType { get; set; }
        }
    }
}
